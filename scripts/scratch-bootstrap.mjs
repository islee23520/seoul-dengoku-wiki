#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { connectionString, quoteIdent, sanitizeError } from './seed-core.mjs'
import { projectRoot, schemaCatalog, readSeedSnapshot } from './seed-sync.mjs'

export function assertScratchTarget(connection) {
  let url
  try { url = new URL(connection) } catch { throw Error('E_SCRATCH_TARGET') }
  const database = decodeURIComponent(url.pathname.slice(1)), host = url.hostname
  // Explicit TCP port and no libpq query overrides: no implicit production
  // endpoint, service, multi-host URI or unvalidated socket can bypass this.
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || !['127.0.0.1', '[::1]'].includes(host)
    || !url.port || url.port === '15433' || !/^seoul_scratch_[a-z0-9_]+$/.test(database)
    || [...url.searchParams].length) throw Error('E_SCRATCH_TARGET')
  return { database, port: Number(url.port) }
}

export function publicSchemaSql(tablesSql, guardsSql, constraintsSql) {
  const tableBoundary = tablesSql.indexOf('CREATE SCHEMA IF NOT EXISTS wiki_private;')
  const guardBoundary = guardsSql.indexOf('SET ROLE wiki_private_owner;')
  if (tableBoundary < 0 || guardBoundary < 0) throw Error('E_SCRATCH_SCHEMA_LAYOUT')
  const tables = tablesSql.slice(0, tableBoundary)
  const guards = guardsSql.slice(0, guardBoundary) + '\nRESET ROLE;\n'
  const constraints = constraintsSql.split('\n').filter(line => line.startsWith('ALTER TABLE wiki.')).join('\n')
  if (!tables.includes('CREATE TABLE wiki."current_region_disposition"')
    || !guards.includes('"current_region_disposition_no_update"')
    || !guards.includes('"current_right_retirement_no_update"')) throw Error('E_SCRATCH_GUARDS')
  return { tables, guards, constraints }
}

export async function bootstrapScratch({ env = process.env, root = projectRoot, client: suppliedClient } = {}) {
  const connection = connectionString(env)
  const target = assertScratchTarget(connection)
  const prefix = resolve(root, 'scripts/postgres-migration/schema-pg')
  const tablesSql = await readFile(resolve(prefix, 'tables.sql'), 'utf8')
  const guardsSql = await readFile(resolve(prefix, 'guards.sql'), 'utf8')
  const constraintsSql = await readFile(resolve(prefix, 'constraints.sql'), 'utf8')
  const sql = publicSchemaSql(tablesSql, guardsSql, constraintsSql)
  const catalog = schemaCatalog(tablesSql, constraintsSql)
  const manifestText = await readFile(resolve(root, 'db/seeds/manifest.json'), 'utf8')
  const snapshot = await readSeedSnapshot({ manifestText, read: f => readFile(resolve(root, 'db/seeds', f), 'utf8'), catalog, baseline: true })
  const client = suppliedClient ?? new pg.Client({ connectionString: connection })
  if (!suppliedClient) await client.connect()
  try {
    const identity = (await client.query('SELECT current_database() AS database, inet_server_addr()::text AS host, inet_server_port() AS port')).rows[0]
    if (identity.database !== target.database || Number(identity.port) !== target.port || !['127.0.0.1', '::1'].includes(identity.host)) throw Error('E_SCRATCH_SERVER')
    if ((await client.query("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema IN ('wiki', 'wiki_private', 'wiki_migrations')")).rows[0].n !== 0) throw Error('E_SCRATCH_NOT_EMPTY')
    await client.query('BEGIN')
    try {
      // Dedicated scratch cluster only. Existing roles are not modified.
      await client.query(`DO $roles$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='wiki_owner') THEN CREATE ROLE wiki_owner NOLOGIN; END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='wiki_reader') THEN CREATE ROLE wiki_reader NOLOGIN; END IF;
      END $roles$;
      CREATE SCHEMA wiki AUTHORIZATION wiki_owner;
      CREATE SCHEMA wiki_private AUTHORIZATION wiki_owner;
      REVOKE ALL ON SCHEMA wiki_private FROM PUBLIC, wiki_reader;`)
      await client.query(sql.tables)
      // Seed INSERTs precede immutable INSERT guards. These are imported rows,
      // never counterfeit migration ledger entries. Baseline replay is separate.
      for (const table of snapshot.manifest.tables) {
        for (const file of table.files) {
          const lines = (await readFile(resolve(root, 'db/seeds', file.file), 'utf8')).split('\n').filter(Boolean)
          for (let i = 0; i < lines.length; i += 1000) {
            const q = `wiki.${quoteIdent(table.table)}`, cols = table.columns.map(quoteIdent).join(', ')
            await client.query(`INSERT INTO ${q} (${cols}) SELECT ${cols} FROM json_populate_recordset(NULL::${q}, $1::json)`, [`[${lines.slice(i, i + 1000).join(',')}]`])
          }
        }
      }
      // NOT VALID FKs preserve imported public rows whose private/meta parents
      // are intentionally absent; all new DML is still constrained.
      await client.query(sql.constraints)
      await client.query(sql.guards)
      await client.query('GRANT USAGE ON SCHEMA wiki TO wiki_reader; GRANT SELECT ON ALL TABLES IN SCHEMA wiki TO wiki_reader')
      await client.query('COMMIT')
      return { mode: 'public', tables: snapshot.manifest.tables.length, guards: true, ledger: 'not-created', state: 'imported-snapshot' }
    } catch (error) { await client.query('ROLLBACK'); throw error }
  } finally { if (!suppliedClient) await client.end() }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length === 3 && process.argv[2] === '--help') console.log('Usage: WIKI_SEEDS_PG[_FILE]=<explicit loopback scratch URL> node scripts/scratch-bootstrap.mjs\nRequires a fresh seoul_scratch_* database on an isolated cluster, explicit port other than 15433. Imports seeds, constraints and guards; never fabricates migration ledger.')
  else if (process.argv.length !== 2) { console.error('E_SCRATCH_ARGS'); process.exitCode = 1 }
  else bootstrapScratch().then(result => console.log(JSON.stringify(result))).catch(error => { console.error(sanitizeError(error)); process.exitCode = 1 })
}
