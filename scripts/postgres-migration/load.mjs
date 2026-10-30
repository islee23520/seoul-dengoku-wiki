#!/usr/bin/env node
// --metadata-only is development recovery only: it re-verifies row counts, then converges
// wiki.meta to the pinned generation commit (metadata.json code_commit), never runtime git HEAD.
// Runtime HEAD is recorded informationally in wiki.meta.loader_commit and is never compared.
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { execFileSync } from 'node:child_process';
import pg from 'pg';
import copyStreams from 'pg-copy-streams';
import { pipeline } from 'node:stream/promises';
const copyFrom = copyStreams.from;

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SCHEMA_DIR = resolve(ROOT, 'scripts/postgres-migration/schema-pg');
const quote = (s) => `"${s.replaceAll('"', '""')}"`;
// Only readers whose historical reconstruction depends on SQLite rowid order.
// Tuple members are decimal integer or text strings, in declared primary-key order.
const LEGACY_ROW_ORDER_KEYS = {
  context_rights_approval: ['approval_id'],
  context_rights_original_source: ['approval_id', 'role'],
  context_rights_transition: ['set_name', 'old_id'],
  context_feudal_binding: ['holding_id'],
  context_feudal_title: ['title_id'],
  context_feudal_jurisdiction: ['title_id', 'ordinal'],
  context_feudal_grant: ['grant_id'],
  context_feudal_grant_admin: ['grant_id', 'ordinal'],
  context_feudal_grant_component: ['grant_id', 'ordinal'],
  context_political_identity: ['identity_id'],
  context_political_identity_liege: ['identity_id', 'ordinal'],
};
function fail(message) { throw new Error(message); }
function options() {
  const args = process.argv.slice(2);
  const get = (key) => { const i = args.indexOf(key); return i < 0 ? undefined : args[i + 1]; };
  const db = get('--db'), connectionString = get('--pg');
  if (!db || !connectionString) fail('usage: load.mjs --db <archive> --pg <url>');
  return { db: resolve(db), connectionString };
}
async function sha256(path) {
  const hash = createHash('sha256');
  await pipeline(createReadStream(path), async function*(source) { for await (const chunk of source) hash.update(chunk); });
  return hash.digest('hex');
}
function pgText(value, type) {
  if (value === null) return '\\N';
  let text;
  if (typeof value === 'bigint') text = value.toString(10);
  else if (value instanceof Uint8Array) text = `\\\\x${Buffer.from(value.buffer, value.byteOffset, value.byteLength).toString('hex')}`;
  else if (typeof value === 'number' && type === 'REAL') {
    if (!Number.isFinite(value)) fail(`unsupported non-finite REAL: ${value}`);
    text = value.toString();
  } else text = String(value);
  if (value instanceof Uint8Array) return text;
  return text.replaceAll('\\', '\\\\').replaceAll('\t', '\\t').replaceAll('\n', '\\n').replaceAll('\r', '\\r');
}
async function applySql(client, path) {
  await client.query(await readFile(path, 'utf8'));
}
async function main() {
  const { db: archive, connectionString } = options();
  const inventory = JSON.parse(await readFile(resolve(SCHEMA_DIR, 'inventory.json'), 'utf8'));
  const meta = JSON.parse(await readFile(resolve(SCHEMA_DIR, 'metadata.json'), 'utf8'));
  const expected = inventory.sources.canonical.sha256;
  if (expected !== meta.source_sha256) fail('inventory/metadata source hash mismatch');
  const sourceHash = await sha256(archive);
  if (sourceHash !== expected) fail(`archive SHA-256 mismatch: expected ${expected}, got ${sourceHash}`);
  const db = new DatabaseSync(archive, { readOnly: true });
  db.prepare('PRAGMA query_only = ON');
  const client = new pg.Client({ connectionString, statement_timeout: 0 });
  await client.connect();
  let active = 'preflight';
  try {
    await client.query('SET statement_timeout = 0');
    const metadataOnly = process.argv.includes('--metadata-only');
    if (metadataOnly) {
      for (const table of inventory.sources.canonical.tables) {
        active = table.name;
        const sourceCount = Number(db.prepare(`SELECT count(*) AS count FROM ${quote(table.name)}`).get().count);
        const target = await client.query(`SELECT count(*) AS count FROM wiki.${quote(table.pg_name)}`);
        if (sourceCount !== table.row_count || Number(target.rows[0].count) !== sourceCount) {
          console.error(`LOAD FAILED table=${active}: metadata-only row count mismatch ${table.name}: source=${sourceCount}, inventory=${table.row_count}, target=${target.rows[0].count}`);
          process.exitCode = 1;
          return;
        }
      }
    }
    await client.query('BEGIN');
    try {
      if (!metadataOnly) for (const table of inventory.sources.canonical.tables) {
        active = table.name;
        const pgTable = table.pg_name;
        const cols = table.columns.map(c => quote(c.name));
        const sql = `COPY wiki.${quote(pgTable)} (${cols.join(',')}) FROM STDIN WITH (FORMAT text)`;
        const copy = client.query(copyFrom(sql));
        let count = 0;
        const stmt = db.prepare(`SELECT ${table.columns.map(c => quote(c.name)).join(',')} FROM ${quote(table.name)}`);
        stmt.setReadBigInts(true);
        async function* rows() {
          for (const row of stmt.iterate()) {
            yield Buffer.from(table.columns.map(c => pgText(row[c.name], c.sqlite_type)).join('\t') + '\n');
            count++;
            if (count % 100000 === 0) process.stderr.write(`COPY ${table.name}: ${count}\n`);
          }
        }
        await pipeline(rows(), copy);
        if (count !== table.row_count) fail(`row count mismatch ${table.name}: ${count} != ${table.row_count}`);
        process.stdout.write(`COPY ${table.name}: ${count} rows\n`);
      }
      if (!metadataOnly) {
        active = 'wiki.legacy_row_order';
        const tables = new Map(inventory.sources.canonical.tables.map(table => [table.name, table]));
        const copy = client.query(copyFrom('COPY wiki.legacy_row_order (table_name,key_json,ordinal) FROM STDIN WITH (FORMAT text)'));
        async function* rowOrders() {
          for (const [name, keys] of Object.entries(LEGACY_ROW_ORDER_KEYS)) {
            const table = tables.get(name);
            if (!table || JSON.stringify(table.primary_key) !== JSON.stringify(keys)) fail(`legacy row order PK mismatch: ${name}`);
            const columns = new Map(table.columns.map(column => [column.name, column]));
            for (const key of keys) {
              if (!['TEXT', 'INTEGER'].includes(columns.get(key)?.sqlite_type)) fail(`unsupported legacy row order PK type: ${name}.${key}`);
            }
            const rowid = ['rowid', '_rowid_', 'oid'].find(alias => !table.columns.some(column => column.name.toLowerCase() === alias));
            if (!rowid) fail(`SQLite rowid is shadowed: ${name}`);
            const stmt = db.prepare(`SELECT ${quote(rowid)} AS ${quote('__legacy_rowid')}, ${keys.map(quote).join(',')} FROM ${quote(name)} ORDER BY ${quote(rowid)}`);
            stmt.setReadBigInts(true);
            let count = 0;
            for (const row of stmt.iterate()) {
              const tuple = keys.map(key => {
                const value = row[key];
                const type = columns.get(key).sqlite_type;
                if ((type === 'TEXT' && typeof value !== 'string') || (type === 'INTEGER' && typeof value !== 'bigint')) fail(`invalid legacy row order PK: ${name}.${key}`);
                return String(value);
              });
              if (typeof row.__legacy_rowid !== 'bigint') fail(`missing SQLite rowid: ${name}`);
              yield Buffer.from([pgText(name), pgText(JSON.stringify(tuple)), pgText(row.__legacy_rowid)].join('\t') + '\n');
              count++;
            }
            if (count !== table.row_count) fail(`legacy row order count mismatch ${name}: ${count} != ${table.row_count}`);
          }
        }
        await pipeline(rowOrders(), copy);
      }
      if (!metadataOnly) {
        active = 'constraints.sql';
        await applySql(client, resolve(SCHEMA_DIR, 'constraints.sql'));
        const fks = await client.query("SELECT n.nspname, c.relname, con.conname FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE con.contype='f' AND NOT con.convalidated AND n.nspname IN ('wiki','wiki_private') ORDER BY n.nspname,c.relname,con.conname");
        for (const fk of fks.rows) {
          active = `${fk.relname}.${fk.conname}`;
          await client.query(`ALTER TABLE ${quote(fk.nspname)}.${quote(fk.relname)} VALIDATE CONSTRAINT ${quote(fk.conname)}`);
        }
        active = 'guards.sql';
        await applySql(client, resolve(SCHEMA_DIR, 'guards.sql'));
      }
      active = 'wiki.meta';
      await client.query(`CREATE TABLE IF NOT EXISTS wiki.meta (
        code_commit text NOT NULL,
        source_sha256 text NOT NULL,
        schema_version bigint NOT NULL,
        migration_id text NOT NULL,
        loaded_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (migration_id)
      )`);
      await client.query('ALTER TABLE wiki.meta ADD COLUMN IF NOT EXISTS loader_commit text');
      const loaderCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
      const insert = `INSERT INTO wiki.meta (code_commit,source_sha256,schema_version,migration_id,loader_commit)
        VALUES ($1,$2,$3,$4,$5)`;
      const values = [meta.code_commit, meta.source_sha256, meta.schema_version, meta.migration_id, loaderCommit];
      if (metadataOnly) {
        await client.query(`${insert} ON CONFLICT (migration_id) DO UPDATE SET
          code_commit = EXCLUDED.code_commit, source_sha256 = EXCLUDED.source_sha256, schema_version = EXCLUDED.schema_version, loader_commit = EXCLUDED.loader_commit`, values);
      } else {
        await client.query(`${insert} ON CONFLICT (migration_id) DO NOTHING`, values);
      }
      await client.query('COMMIT');
    } catch (error) {
      try { await client.query('ROLLBACK'); } catch { /* connection failure: ROLLBACK is unavailable */ }
      console.error(`LOAD FAILED table=${active}: ${error.message}`);
      if (error.detail) console.error(error.detail);
      process.exitCode = 1;
      return;
    }
  } finally {
    db.close();
    await client.end();
  }
}
main().catch(error => { console.error(`LOAD FAILED table=preflight: ${error.message}`); process.exitCode = 1; });
