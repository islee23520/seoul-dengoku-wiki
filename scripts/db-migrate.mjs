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
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

export const MIGRATIONS_FOLDER = fileURLToPath(new URL('../db/migrations', import.meta.url));
export const MIGRATIONS_SCHEMA = 'wiki_migrations';

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

export async function runMigrations({ env = process.env, log = console.log } = {}) {
  const pool = new pg.Pool({ connectionString: connectionString(env), max: 1 });
  try {
    const client = await pool.connect();
    const applied = async () => (await client.query(
      `SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = $1 AND table_name = '__drizzle_migrations'`,
      [MIGRATIONS_SCHEMA])).rows[0].n
      ? (await client.query(`SELECT count(*)::int AS n FROM ${MIGRATIONS_SCHEMA}.__drizzle_migrations`)).rows[0].n : 0;
    const before = await applied();
    client.release();
    await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS_FOLDER, migrationsSchema: MIGRATIONS_SCHEMA });
    const after = await (async () => { const c = await pool.connect(); try { return await (async () => {
      const n = (await c.query(`SELECT count(*)::int AS n FROM ${MIGRATIONS_SCHEMA}.__drizzle_migrations`)).rows[0].n;
      // Public read contract, re-asserted after every run.
      await c.query('GRANT USAGE ON SCHEMA wiki TO wiki_reader');
      await c.query('GRANT SELECT ON ALL TABLES IN SCHEMA wiki TO wiki_reader');
      // seed_sync_log (0001) is a private table in the public schema (design D7):
      // re-close it after the blanket grant above so every migrate run keeps it
      // out of the anonymous reader. Older databases without the table skip this.
      const logTable = await c.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema = 'wiki' AND table_name = 'seed_sync_log'`);
      if (logTable.rowCount > 0) {
        await c.query('REVOKE SELECT ON TABLE wiki.seed_sync_log FROM wiki_reader');
      }
      return n;
    })(); } finally { c.release(); } })();
    log(JSON.stringify({ event: 'wiki-migrate', applied: after - before, total: after }));
    return { applied: after - before, total: after };
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runMigrations().catch((error) => {
    // Driver errors can echo connection details; report only the code and message.
    console.error(`E_MIGRATE_FAILED: ${error?.code ?? ''} ${String(error?.message ?? error).replace(/postgres(ql)?:\/\/\S+/giu, '<url>')}`);
    process.exit(1);
  });
}
