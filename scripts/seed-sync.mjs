#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { readFile, writeFile, mkdir, readdir, lstat, mkdtemp, cp, rm } from 'node:fs/promises'
import { dirname, resolve, relative } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { quoteIdent, sanitizeError } from './seed-core.mjs'
import { parseSeedRow, seedRowKey, LOSSLESS_TYPES } from './seed-lossless.mjs'
import { assertSeedEdit, isEditableSeedTable } from './seed-edit-scope.mjs'
import { isPublicTable } from '../server/wiki-table-allowlist.mjs'
import { isSeedTable } from './seed-scope.mjs'
import { readRetirementProseAsync } from './cast-sqlite/retirement-prose.mjs'
import { readCiaCurrentRightsAsync } from './cast-sqlite/cia-current-rights.mjs'

const exec = promisify(execFile)
export const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const sha256 = value => createHash('sha256').update(value).digest('hex')
export const jsonBytes = value => `${JSON.stringify(value, null, 2)}\n`
const fail = (code, detail = '') => { throw Object.assign(new Error(`${code}: ${detail}`), { code }) }
const ident = name => /^[A-Za-z_][A-Za-z_0-9]*$/.test(name)
export async function gitRead(root, ref, path) {
  return (await exec('git', ['-C', root, 'show', `${ref}:${path}`], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })).stdout
}

export function schemaCatalog(tablesSql, constraintsSql) {
  const catalog = new Map()
  for (const match of tablesSql.matchAll(/CREATE TABLE wiki\."([^"]+)" \(\n([\s\S]*?)\n\);/g)) {
    const columns = [...match[2].matchAll(/^  "([^"]+)" (text|bigint|double precision|bytea)\b(.*)/gm)]
      .map(([, name, type, rest]) => ({ name, type, nullable: !rest.includes('NOT NULL') }))
    const pk = /PRIMARY KEY \(([^)]+)\)/.exec(match[2])
    catalog.set(match[1], { table: match[1], columns, primary_key: pk ? [...pk[1].matchAll(/"([^"]+)"/g)].map(m => m[1]) : [], foreignKeys: [] })
  }
  for (const m of constraintsSql.matchAll(/ALTER TABLE wiki\."([^"]+)"[^\n]*FOREIGN KEY \(([^)]+)\) REFERENCES wiki\."([^"]+)" \(([^)]+)\)/g)) {
    catalog.get(m[1])?.foreignKeys.push({ columns: [...m[2].matchAll(/"([^"]+)"/g)].map(x => x[1]), table: m[3], references: [...m[4].matchAll(/"([^"]+)"/g)].map(x => x[1]) })
  }
  return catalog
}

function checkManifest(manifest, catalog) {
  if (manifest.format !== 'wiki-seeds/1' || manifest.schema !== 'wiki' || !Array.isArray(manifest.tables)) fail('E_SYNC_MANIFEST')
  const seen = new Set(), files = new Set()
  for (const table of manifest.tables) {
    const schema = catalog.get(table.table)
    if (!isPublicTable(table.table) || !isSeedTable(table.table)) fail('E_SYNC_OUT_OF_SCOPE', table.table)
    if (!schema || seen.has(table.table) || !ident(table.table)
      || JSON.stringify(table.columns) !== JSON.stringify(schema.columns.map(c => c.name))
      || JSON.stringify(table.primary_key) !== JSON.stringify(schema.primary_key)
      || !table.primary_key.length || !Array.isArray(table.files) || !table.files.length) fail('E_SYNC_SCHEMA_CHANGED', table.table)
    seen.add(table.table)
    for (const item of table.files) {
      if (!/^[a-z0-9-]+\/[A-Za-z0-9_]+(?:\.part-\d{3})?\.jsonl$/.test(item.file) || files.has(item.file)) fail('E_SYNC_MANIFEST', 'unsafe/duplicate path')
      files.add(item.file)
    }
  }
}

function compareKeys(a, b, keys) {
  for (const key of keys) {
    const x = a.values[key], y = b.values[key]
    const n = typeof x === 'string' && typeof y === 'string' ? Buffer.compare(Buffer.from(x), Buffer.from(y)) : x < y ? -1 : x > y ? 1 : 0
    if (n) return n
  }
  return 0
}

export function parseTableRows(texts, schema) {
  const rows = [], seen = new Set()
  for (const text of texts) {
    if (!text.endsWith('\n') || text.includes('\r')) fail('E_SYNC_ROW', 'LF-terminated JSONL required')
    const lines = text === '\n' ? [] : text.slice(0, -1).split('\n')
    for (const line of lines) {
      const row = parseSeedRow(line)
      if (JSON.stringify(Object.keys(row.tokens).sort()) !== JSON.stringify(schema.columns.map(c => c.name).sort())) fail('E_SYNC_SCHEMA_CHANGED', schema.table)
      for (const col of schema.columns) {
        const value = row.values[col.name]
        if (!LOSSLESS_TYPES.has(col.type) || !ident(col.name)) fail('E_SYNC_SCHEMA_CHANGED')
        if (value === null) {
          if (!col.nullable || schema.primary_key.includes(col.name)) fail('E_SYNC_NULL', col.name)
        } else if (col.type === 'bigint') {
          if (typeof value !== 'bigint' || value < -9223372036854775808n || value > 9223372036854775807n) fail('E_SYNC_BIGINT', col.name)
        } else if (col.type === 'double precision') {
          if (!['number', 'bigint'].includes(typeof value) || !Number.isFinite(Number(value))) fail('E_SYNC_FLOAT', col.name)
        } else if (typeof value !== 'string' || (col.type === 'bytea' && !/^\\x(?:[0-9a-f]{2})*$/.test(value))) fail('E_SYNC_TYPE', col.name)
      }
      const key = seedRowKey(row, schema.primary_key)
      if (seen.has(key)) fail('E_SYNC_DUPLICATE_PK', schema.table)
      // The historical exporter uses DB collation, which is not recorded in
      // manifest v1. Never invent a JS text collation for that immutable tree.
      // Numeric keys have an unambiguous order; existing text-key order is
      // checked against the actual baseline by diffSnapshots below.
      if (schema.primary_key.every(key => schema.columns.find(c => c.name === key).type !== 'text')
        && rows.length && compareKeys(rows.at(-1), row, schema.primary_key) >= 0) fail('E_SYNC_ROW_ORDER', schema.table)
      seen.add(key); rows.push(row)
    }
  }
  return rows
}

// Strict baseline verification; edited files may still carry baseline manifest
// hashes. Only the generator recomputes the target manifest from actual bytes.
export async function readSeedSnapshot({ manifestText, read, catalog, baseline = false }) {
  const manifest = JSON.parse(manifestText)
  checkManifest(manifest, catalog)
  const actual = structuredClone(manifest), tables = new Map(), files = new Map()
  for (const table of actual.tables) {
    const texts = []
    let count = 0
    for (const item of table.files) {
      const text = await read(item.file)
      if (!text.endsWith('\n') || text.includes('\r')) fail('E_SYNC_ROW', item.file)
      const rows = text === '\n' ? 0 : text.slice(0, -1).split('\n').length
      const hash = sha256(text)
      if (baseline && (item.rows !== rows || item.sha256 !== hash)) fail('E_SYNC_BASE_MANIFEST', item.file)
      item.rows = rows; item.sha256 = hash; count += rows
      if (isEditableSeedTable(table.table)) { texts.push(text); files.set(item.file, text) }
    }
    if (baseline && table.rows !== count) fail('E_SYNC_BASE_MANIFEST', table.table)
    table.rows = count
    tables.set(table.table, { entry: table, rows: isEditableSeedTable(table.table) ? parseTableRows(texts, catalog.get(table.table)) : null })
  }
  return { manifest: actual, manifestText: baseline ? manifestText : jsonBytes(actual), tables, files }
}

export function diffSnapshots(base, next, catalog) {
  const shape = manifest => manifest.tables.map(({ table, domain, columns, primary_key, files }) => ({ table, domain, columns, primary_key, files: files.map(f => f.file) }))
  if (JSON.stringify(shape(base.manifest)) !== JSON.stringify(shape(next.manifest))) fail('E_SYNC_SCHEMA_CHANGED', 'table/column/PK/shard layout')
  const changes = []
  for (const [name, before] of base.tables) {
    const after = next.tables.get(name)
    if (JSON.stringify(before.entry) === JSON.stringify(after.entry)) continue
    assertSeedEdit(name, 'insert')
    const schema = catalog.get(name), keyOf = r => seedRowKey(r, schema.primary_key)
    const oldRows = new Map(before.rows.map(r => [keyOf(r), r]))
    const newRows = new Map(after.rows.map(r => [keyOf(r), r]))
    const removed = before.rows.filter(r => !newRows.has(keyOf(r)))
    const inserted = after.rows.filter(r => !oldRows.has(keyOf(r)))
    if (removed.length) {
      const nonPk = schema.columns.map(c => c.name).filter(c => !schema.primary_key.includes(c))
      const pkChange = removed.some(a => inserted.some(b => nonPk.every(c => a.tokens[c] === b.tokens[c])))
      fail(pkChange ? 'E_SYNC_PK_CHANGE' : 'E_SYNC_DELETE_PRESENT', name)
    }
    if (JSON.stringify(after.rows.filter(r => oldRows.has(keyOf(r))).map(keyOf)) !== JSON.stringify(before.rows.map(keyOf))) fail('E_SYNC_ROW_ORDER', name)
    for (const row of after.rows) {
      const old = oldRows.get(keyOf(row))
      if (old?.canonical === row.canonical) continue
      const operation = old ? 'update' : 'insert'
      assertSeedEdit(name, operation)
      changes.push({ table: name, operation, key: keyOf(row), before: old?.canonical ?? null, after: row.canonical })
    }
  }
  return orderChanges(changes, catalog)
}

export function orderChanges(changes, catalog) {
  const output = [], visiting = new Set(), done = new Set()
  const visit = change => {
    if (done.has(change)) return
    if (visiting.has(change)) fail('E_SYNC_FK_CYCLE', change.table)
    visiting.add(change)
    const row = parseSeedRow(change.after)
    for (const fk of catalog.get(change.table).foreignKeys) {
      if (fk.columns.some(c => row.values[c] === null)) continue
      for (const parent of changes.filter(c => c.table === fk.table && c.operation === 'insert')) {
        const target = parseSeedRow(parent.after)
        if (fk.columns.every((c, i) => row.tokens[c] === target.tokens[fk.references[i]])) visit(parent)
      }
    }
    visiting.delete(change); done.add(change); output.push(change)
  }
  changes.forEach(visit)
  return output
}

export async function validateDomains(snapshot, changes) {
  const rows = table => (snapshot.tables.get(table)?.rows ?? []).map(r => r.values)
  if (changes.some(c => c.table.startsWith('current_'))) {
    await readCiaCurrentRightsAsync({ get: async () => ({}), all: async sql => sql.includes('current_right_retirement') ? rows('current_right_retirement') : rows('current_region_disposition') })
  }
  if (changes.some(c => c.table === 'retirement_prose')) {
    for (const row of rows('retirement_prose')) if (!row.actor?.trim() || !row.decision_ref?.trim()) fail('E_SYNC_DOMAIN', 'retirement audit')
    await readRetirementProseAsync({ all: async () => rows('retirement_prose') })
  }
}

// Hex transport prevents quotes, dollar tags and Drizzle's breakpoint marker in
// user strings from ever becoming SQL syntax. PG still performs typed decoding.
export const sqlJson = text => `convert_from(decode('${Buffer.from(text).toString('hex')}', 'hex'), 'UTF8')::json`
const tableSql = name => `${quoteIdent('wiki')}.${quoteIdent(name)}`
const matchCols = (cols, left, right) => cols.map(c => `${left}.${quoteIdent(c)} IS NOT DISTINCT FROM ${right}.${quoteIdent(c)}`).join(' AND ')

export function migrationSql(payload) {
  const header = { ...payload, tables: payload.tables.map(({ before, after, ...table }) => table), delta: undefined, targetFiles: undefined, metadataSha256: sha256(jsonBytes(payload)) }
  const statements = []
  const affected = payload.tables.map(t => tableSql(t.table)).sort()
  statements.push(`LOCK TABLE ${affected.join(', ')} IN SHARE ROW EXCLUSIVE MODE;`)
  for (const change of payload.delta.filter(c => c.operation === 'insert')) {
    const table = payload.tables.find(t => t.table === change.table), q = tableSql(table.table)
    statements.push(`DO $sync$ BEGIN\n  IF EXISTS (SELECT 1 FROM ${q} t, json_populate_record(NULL::${q}, ${sqlJson(change.after)}) n WHERE ${matchCols(table.primary_key, 't', 'n')}) THEN\n    RAISE EXCEPTION 'E_SYNC_INSERT_EXISTS: ${table.table}';\n  END IF;\nEND $sync$;`)
  }
  const tableCheck = (table, stage) => {
    const q = tableSql(table.table), cols = table.columns.map(quoteIdent).join(', '), order = table.primary_key.map(quoteIdent).join(', ')
    const digest = source => `(SELECT sha256(convert_to(COALESCE(jsonb_agg(to_jsonb(r) ORDER BY ${order})::text, '[]'), 'UTF8')) FROM (SELECT ${cols} FROM ${source}) r)`
    return `DO $sync$ BEGIN\n  IF ${digest(q)} IS DISTINCT FROM ${digest(`json_populate_recordset(NULL::${q}, ${sqlJson(`[${table[stage].join(',')}]`)})`)} THEN\n    RAISE EXCEPTION 'E_SYNC_${stage === 'before' ? 'BASE_MOVED' : 'TARGET_MISMATCH'}: ${table.table}';\n  END IF;\nEND $sync$;`
  }
  payload.tables.forEach(t => statements.push(tableCheck(t, 'before')))
  for (const change of payload.delta) {
    const table = payload.tables.find(t => t.table === change.table), q = tableSql(table.table)
    let body
    if (change.operation === 'insert') {
      body = `BEGIN\n    INSERT INTO ${q} (${table.columns.map(quoteIdent).join(', ')}) SELECT ${table.columns.map(c => `n.${quoteIdent(c)}`).join(', ')} FROM json_populate_record(NULL::${q}, ${sqlJson(change.after)}) n;\n  EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'E_SYNC_INSERT_EXISTS: ${table.table}';\n  END;`
    } else {
      const predicate = matchCols(table.columns, 't', 'b')
      const old = `json_populate_record(NULL::${q}, ${sqlJson(change.before)}) b`
      body = `PERFORM 1 FROM ${q} t, ${old} WHERE ${predicate} FOR UPDATE OF t;\n  UPDATE ${q} t SET ${table.columns.filter(c => !table.primary_key.includes(c)).map(c => `${quoteIdent(c)} = n.${quoteIdent(c)}`).join(', ')} FROM ${old}, json_populate_record(NULL::${q}, ${sqlJson(change.after)}) n WHERE ${predicate};`
    }
    statements.push(`DO $sync$ DECLARE affected bigint; BEGIN\n  ${body}\n  GET DIAGNOSTICS affected = ROW_COUNT;\n  IF affected <> 1 THEN RAISE EXCEPTION 'E_SYNC_BASE_MOVED: ${table.table}'; END IF;\nEND $sync$;`)
  }
  payload.tables.forEach(t => statements.push(tableCheck(t, 'after')))
  // Header is hex JSON too: actor/reason cannot insert a breakpoint or newline.
  return `-- wiki-data-change/1 ${Buffer.from(JSON.stringify(header)).toString('hex')}\n${statements.join('\n--> statement-breakpoint\n')}\n`
}

export function buildPayload({ base, next, catalog, changes, baseRef, actor, reason, changeId }) {
  if (!/^[a-f0-9]{40}$/.test(baseRef)) fail('E_SYNC_BASE_REF')
  if (!actor?.trim() || !reason?.trim() || !/^[a-z0-9][a-z0-9_-]{0,79}$/.test(changeId ?? '')) fail('E_SYNC_AUDIT')
  if (!changes.length) fail('E_SYNC_NO_CHANGES')
  const tables = [...new Set(changes.map(c => c.table))].sort().map(table => ({ table,
    columns: catalog.get(table).columns.map(c => c.name), primary_key: catalog.get(table).primary_key,
    inserts: changes.filter(c => c.table === table && c.operation === 'insert').length,
    updates: changes.filter(c => c.table === table && c.operation === 'update').length,
    before: base.tables.get(table).rows.map(r => r.canonical), after: next.tables.get(table).rows.map(r => r.canonical),
  }))
  return { format: 'wiki-data-change/1', changeId, actor, reason, baseCommit: baseRef,
    baseSeedManifestSha256: sha256(base.manifestText), targetSeedManifestSha256: sha256(next.manifestText),
    rowDeltaSha256: sha256(jsonBytes(changes)), tables, delta: changes,
    targetFiles: Object.fromEntries(tables.flatMap(t => next.tables.get(t.table).entry.files.map(f => [f.file, next.files.get(f.file)]))) }
}

async function checkedFile(root, file) {
  const parts = file.split('/')
  let current = root
  for (const part of parts) {
    current = resolve(current, part)
    if ((await lstat(current)).isSymbolicLink()) fail('E_SYNC_SYMLINK', file)
  }
  return readFile(current, 'utf8')
}

export async function loadDiff({ root = projectRoot, baseRef }) {
  const resolved = (await exec('git', ['-C', root, 'rev-parse', '--verify', `${baseRef}^{commit}`])).stdout.trim()
  if (!/^[a-f0-9]{40}$/.test(resolved)) fail('E_SYNC_BASE_REF')
  const schemaPath = 'scripts/postgres-migration/schema-pg/'
  const tablesSql = await gitRead(root, resolved, schemaPath + 'tables.sql')
  const constraintsSql = await gitRead(root, resolved, schemaPath + 'constraints.sql')
  if (tablesSql !== await readFile(resolve(root, schemaPath, 'tables.sql'), 'utf8') || constraintsSql !== await readFile(resolve(root, schemaPath, 'constraints.sql'), 'utf8')) fail('E_SYNC_SCHEMA_CHANGED')
  const catalog = schemaCatalog(tablesSql, constraintsSql)
  const seeds = resolve(root, 'db/seeds')
  try { await lstat(resolve(seeds, '.promote-pending.json')); fail('E_SEED_PROMOTE_PENDING') } catch (error) { if (error.code !== 'ENOENT') throw error }
  const manifestText = await checkedFile(seeds, 'manifest.json')
  const allowed = new Set(JSON.parse(manifestText).tables.flatMap(t => t.files.map(f => f.file)))
  const walk = async dir => {
    for (const entry of await readdir(resolve(seeds, dir), { withFileTypes: true })) {
      const path = dir ? `${dir}/${entry.name}` : entry.name
      if (entry.isSymbolicLink()) fail('E_SYNC_SYMLINK', path)
      if (entry.isDirectory()) await walk(path)
      else if (path.endsWith('.jsonl') && !allowed.has(path)) fail('E_SYNC_UNLISTED_FILE', path)
    }
  }
  await walk('')
  const base = await readSeedSnapshot({ manifestText: await gitRead(root, resolved, 'db/seeds/manifest.json'), read: f => gitRead(root, resolved, 'db/seeds/' + f), catalog, baseline: true })
  const next = await readSeedSnapshot({ manifestText, read: f => checkedFile(seeds, f), catalog })
  const changes = diffSnapshots(base, next, catalog)
  await validateDomains(next, changes)
  return { base, next, catalog, changes, baseRef: resolved }
}

export async function emitMigration({ root = projectRoot, name, payload, targetManifestText }) {
  if (!/^[a-z0-9][a-z0-9_]{0,60}$/.test(name ?? '')) fail('E_SYNC_NAME')
  const kit = JSON.parse(await readFile(resolve(root, 'node_modules/drizzle-kit/package.json'), 'utf8'))
  if (kit.version !== '0.31.11') fail('E_SYNC_KIT_VERSION')
  const { readMigrationInventory } = await import('./check-migration-provenance.mjs')
  await readMigrationInventory({ root })
  const metadataPath = resolve(root, 'db/data-changes', `${payload.changeId}.json`)
  try { await lstat(metadataPath); fail('E_SYNC_CHANGE_ID_EXISTS') } catch (e) { if (e.code !== 'ENOENT') throw e }
  // Let the pinned generator allocate the journal/meta in an isolated directory.
  // Failed generation never leaves a half-written live journal.
  const staging = await mkdtemp(resolve(tmpdir(), 'wiki-data-migration-'))
  try {
    await cp(resolve(root, 'db/migrations'), resolve(staging, 'migrations'), { recursive: true })
    await writeFile(resolve(staging, 'schema.mjs'), 'export {};\n')
    await writeFile(resolve(staging, 'drizzle.config.mjs'), `export default {dialect:'postgresql',schema:'./schema.mjs',out:'./migrations'};\n`)
    const oldJournal = await readFile(resolve(root, 'db/migrations/meta/_journal.json'), 'utf8')
    await exec(process.execPath, [resolve(root, 'node_modules/drizzle-kit/bin.cjs'), 'generate', '--custom', '--name', `data_${name}`, '--config', resolve(staging, 'drizzle.config.mjs')], { cwd: staging, maxBuffer: 8 * 1024 * 1024 })
    const journalText = await readFile(resolve(staging, 'migrations/meta/_journal.json'), 'utf8')
    const old = JSON.parse(oldJournal), journal = JSON.parse(journalText), last = journal.entries.at(-1)
    if (journal.entries.length !== old.entries.length + 1 || JSON.stringify(journal.entries.slice(0, -1)) !== JSON.stringify(old.entries) || !last.tag.endsWith(`_data_${name}`) || last.when <= (old.entries.at(-1)?.when ?? 0)) fail('E_SYNC_KIT_OUTPUT')
    if (oldJournal !== await readFile(resolve(root, 'db/migrations/meta/_journal.json'), 'utf8')) fail('E_SYNC_JOURNAL_MOVED')
    await mkdir(dirname(metadataPath), { recursive: true })
    // A crash during these writes is fail-closed: orphan SQL/metadata or a target
    // manifest mismatch is rejected by preflight. No DB changes occur here.
    await writeFile(metadataPath, jsonBytes(payload), { flag: 'wx' })
    await writeFile(resolve(root, `db/migrations/${last.tag}.sql`), migrationSql(payload), { flag: 'wx' })
    const snapshot = `${String(last.idx).padStart(4, '0')}_snapshot.json`
    await writeFile(resolve(root, 'db/migrations/meta', snapshot), await readFile(resolve(staging, 'migrations/meta', snapshot)), { flag: 'wx' })
    await writeFile(resolve(root, 'db/seeds/manifest.json'), targetManifestText)
    await writeFile(resolve(root, 'db/migrations/meta/_journal.json'), journalText)
    return { tag: last.tag, metadata: relative(root, metadataPath).replaceAll('\\', '/') }
  } finally { await rm(staging, { recursive: true, force: true }) }
}

export async function main(argv = process.argv.slice(2)) {
  if (argv.length === 1 && argv[0] === '--help') {
    console.log('Usage: node scripts/seed-sync.mjs --base-ref <commit> --actor <actor> --reason <reason> --change-id <id> [--emit-migration --name <slug>]\nDefault: offline diff; never connects to PostgreSQL. Emission uses drizzle-kit 0.31.11.')
    return
  }
  const options = {}
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i]
    if (key === '--emit-migration') options.emit = true
    else if (['--base-ref', '--actor', '--reason', '--change-id', '--name'].includes(key) && argv[i + 1] && !argv[i + 1].startsWith('--')) {
      if (options[key] !== undefined) fail('E_SYNC_ARGS', key)
      options[key] = argv[++i]
    } else fail('E_SYNC_ARGS', key)
  }
  if (!options['--base-ref'] || !options['--actor']?.trim() || !options['--reason']?.trim() || !options['--change-id']) fail('E_SYNC_ARGS', '--base-ref --actor --reason --change-id required')
  const diff = await loadDiff({ baseRef: options['--base-ref'] })
  if (!diff.changes.length) { console.log(JSON.stringify({ event: 'seed-sync', changes: 0 })); return }
  const payload = buildPayload({ ...diff, actor: options['--actor'], reason: options['--reason'], changeId: options['--change-id'] })
  const emitted = options.emit ? await emitMigration({ name: options['--name'], payload, targetManifestText: diff.next.manifestText }) : {}
  console.log(JSON.stringify({ event: 'seed-sync', changes: payload.delta.length, tables: payload.tables.map(t => t.table), ...emitted }))
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => {
  console.error(sanitizeError(error)); process.exitCode = 1
})
