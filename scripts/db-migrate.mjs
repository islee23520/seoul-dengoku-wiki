#!/usr/bin/env node
// Apply reviewed drizzle migrations from db/migrations to the PostgreSQL wiki
// database. This is the only supported path for table changes: a migration
// is written with `npx drizzle-kit generate --custom --name <change>`,
// reviewed and merged to main through a pull request, and then applied by the
// host applier (deploy/docker-compose.wiki-migrate.yml) running this script.
//
// Connection: WIKI_MIGRATE_PG (URL) or WIKI_MIGRATE_PG_FILE (owner-only file),
// otherwise the standard libpq variables PGHOST/PGUSER/PGPASSWORD/PGDATABASE.
// The connecting role must own schema `wiki` (wiki_owner).
//
// After every run, the public read contract is re-asserted: wiki_reader can
// SELECT every table in schema `wiki` (and never anything in wiki_private).
import { closeSync, constants, fstatSync, openSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { readMigrationInventory, readLedger, verifyLedger, ledgerDigest } from './check-migration-provenance.mjs';

export const MIGRATIONS_FOLDER = fileURLToPath(new URL('../db/migrations', import.meta.url));
export const MIGRATIONS_SCHEMA = 'wiki_migrations';
export const MIGRATION_LOCK = 'wiki-migrate-v1';
export const PROJECTION_ENV = Object.freeze({
  stateFile: 'WIKI_PROJECTION_STATE_FILE',
  codeRef: 'WIKI_MIGRATE_CODE_REF',
  refreshService: 'WIKI_MIGRATE_POST_REFRESH_SERVICE',
});

// The host owns the fsynced pending fence and the shared migrate/refresh/worker
// flock. This process verifies that fence; it never writes or clears it.
export async function verifyProjectionStatePrecondition(env = process.env) {
  if (env.WIKI_PROJECTION_STATE_FILE === undefined) return;
  try {
    if (!/^[a-f0-9]{40}$/.test(env.WIKI_MIGRATE_CODE_REF ?? '')) throw Error();
    const state = JSON.parse(await readFile(env.WIKI_PROJECTION_STATE_FILE, 'utf8'));
    if (state.status !== 'applied-awaiting-projection' || state.pendingWatermark !== env.WIKI_MIGRATE_CODE_REF) throw Error();
  } catch {
    throw Object.assign(Error('E_PROJECTION_STATE_PRECONDITION'), { code: 'E_PROJECTION_STATE_PRECONDITION' });
  }
}

export async function triggerPostRefreshService(env = process.env, execute = promisify(execFile)) {
  const service = env.WIKI_MIGRATE_POST_REFRESH_SERVICE;
  if (service === undefined) return;
  if (!/^[A-Za-z0-9][A-Za-z0-9_.@-]*\.service$/.test(service)) throw Error('E_MIGRATE_REFRESH_SERVICE');
  await execute('systemctl', ['start', '--no-block', service], { env });
}

function connectionString(env) {
  if (env.WIKI_MIGRATE_PG !== undefined && env.WIKI_MIGRATE_PG_FILE !== undefined) {
    throw new Error('E_MIGRATE_CONFIG: select only one of WIKI_MIGRATE_PG and WIKI_MIGRATE_PG_FILE');
  }
  if (env.WIKI_MIGRATE_PG_FILE === undefined) return env.WIKI_MIGRATE_PG?.trim() || undefined;
  let fd;
  try {
    fd = openSync(env.WIKI_MIGRATE_PG_FILE, constants.O_RDONLY | constants.O_NOFOLLOW);
    const info = fstatSync(fd);
    if (!info.isFile() || (info.mode & 0o077) !== 0) throw new Error();
    return readFileSync(fd, 'utf8').trim();
  } catch {
    throw new Error('E_MIGRATE_CONFIG: WIKI_MIGRATE_PG_FILE must be a regular file not readable by group or others');
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

export async function runMigrations({ env = process.env, log = console.log,
  root = fileURLToPath(new URL('..', import.meta.url)), client: suppliedClient,
  refresh = triggerPostRefreshService, beforeCommit = async () => {},
} = {}) {
  // Pin actual SQL bytes before connecting; dialect receives this inventory so
  // a second filesystem read cannot silently change the preflighted statements.
  const entries = await readMigrationInventory({ root });
  await verifyProjectionStatePrecondition(env);
  const pool = suppliedClient ? null : new pg.Pool({ connectionString: connectionString(env), max: 1 });
  let client, locked = false;
  try {
    client = suppliedClient ?? await pool.connect();
    await client.query('SELECT pg_advisory_lock(hashtextextended($1, 0))', [MIGRATION_LOCK]);
    locked = true;
    const before = await readLedger(client);
    const preflight = verifyLedger(entries, before, { allowPending: true });
    // Recheck after waiting on another runner, immediately before Drizzle starts
    // its ledger transaction. The durable file is not a self-claimed SQL hash.
    await verifyProjectionStatePrecondition(env);
    const db = drizzle(client);
    const transaction = db.session.transaction.bind(db.session);
    db.session.transaction = (work, config) => transaction(async tx => {
      const value = await work(tx);
      const pending = await readLedger(client);
      verifyLedger(entries, pending);
      await beforeCommit({ status: 'applied-awaiting-projection', pendingWatermark: env.WIKI_MIGRATE_CODE_REF,
        ledgerDigest: ledgerDigest(pending), applied: preflight.pending.length });
      return value;
    }, config);
    try {
      await db.dialect.migrate(entries.map(e => ({ sql: e.sql, hash: e.hash, folderMillis: e.when, bps: e.breakpoints })), db.session,
        { migrationsFolder: MIGRATIONS_FOLDER, migrationsSchema: MIGRATIONS_SCHEMA });
    } catch (error) {
      // A COMMIT transport failure can have an unknown outcome. Observe the
      // ledger instead of claiming a rollback merely because migrate threw.
      let outcome = 'unknown';
      try {
        const observed = await readLedger(client);
        outcome = ledgerDigest(observed) === ledgerDigest(before) ? 'rolled-back' : 'applied-awaiting-projection';
      } catch { /* Preserve the original failure and unknown commit outcome. */ }
      log(JSON.stringify({ event: 'wiki-migrate-failed', outcome }));
      error.migrationOutcome = outcome;
      throw error;
    }
    const after = await readLedger(client);
    verifyLedger(entries, after);
    const result = { applied: after.length - before.length, total: after.length,
      status: 'applied-awaiting-projection', ledgerDigest: ledgerDigest(after) };
    log(JSON.stringify({ event: 'wiki-migrate-committed', ...result }));
    try {
      // Public read contract remains a post-commit step on EVERY run, including
      // no-op ledger replays. Its failure cannot roll committed data back.
      await client.query('GRANT USAGE ON SCHEMA wiki TO wiki_reader');
      await client.query('GRANT SELECT ON ALL TABLES IN SCHEMA wiki TO wiki_reader');
      await refresh(env);
    } catch (cause) {
      throw Object.assign(Error(`E_MIGRATE_POST_COMMIT: ${String(cause.message).replace(/postgres(ql)?:\/\/\S+/giu, '<url>')}`, { cause }),
        { code: 'E_MIGRATE_POST_COMMIT', migrationOutcome: 'applied-awaiting-projection', result });
    }
    log(JSON.stringify({ event: 'wiki-migrate', ...result }));
    return result;
  } finally {
    try {
      if (locked) await client.query('SELECT pg_advisory_unlock(hashtextextended($1, 0))', [MIGRATION_LOCK]);
    } finally {
      if (client && !suppliedClient) client.release();
      if (pool) await pool.end();
    }
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  runMigrations().catch((error) => {
    // Driver errors can echo connection details; report only the code and message.
    console.error(`E_MIGRATE_FAILED: ${error?.code ?? ''} ${String(error?.message ?? error).replace(/postgres(ql)?:\/\/\S+/giu, '<url>')}`);
    process.exit(1);
  });
}
