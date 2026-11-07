#!/usr/bin/env node
import { readFile, readdir, writeFile, lstat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readMigrationFiles } from 'drizzle-orm/migrator'
import { makePgExecutor, makePsqlExecutor, sanitizeError, jsonLines, quoteIdent } from './seed-core.mjs'
import { projectRoot, sha256, jsonBytes, gitRead, schemaCatalog, readSeedSnapshot, diffSnapshots, validateDomains, buildPayload, migrationSql, parseTableRows } from './seed-sync.mjs'

const fail = (code, detail = '') => { throw Object.assign(new Error(`${code}: ${detail}`), { code }) }
const hashPattern = /^[a-f0-9]{64}$/
export function ledgerDigest(rows) {
  const normalized = rows.map(row => ({ when: String(row.when ?? row.created_at), hash: row.hash }))
  for (const row of normalized) if (!/^[1-9]\d*$/.test(row.when) || !hashPattern.test(row.hash)) fail('E_PROVENANCE_LEDGER')
  normalized.sort((a, b) => BigInt(a.when) < BigInt(b.when) ? -1 : BigInt(a.when) > BigInt(b.when) ? 1 : a.hash.localeCompare(b.hash))
  return sha256(jsonBytes(normalized))
}

export function verifyLedger(entries, ledger, { allowPending = false } = {}) {
  const seenWhen = new Set(), seenHash = new Set()
  const sorted = [...ledger].sort((a, b) => BigInt(a.when ?? a.created_at) < BigInt(b.when ?? b.created_at) ? -1 : 1)
  const digest = ledgerDigest(sorted)
  for (const [i, row] of sorted.entries()) {
    const when = String(row.when ?? row.created_at)
    if (seenWhen.has(when) || seenHash.has(row.hash)) fail('E_PROVENANCE_LEDGER_DUPLICATE')
    seenWhen.add(when); seenHash.add(row.hash)
    if (!entries[i] || String(entries[i].when) !== when || entries[i].hash !== row.hash) fail('E_PROVENANCE_LEDGER_MISMATCH')
  }
  if (!allowPending && sorted.length !== entries.length) fail('E_PROVENANCE_LEDGER_MISSING')
  return { applied: sorted.length, pending: entries.slice(sorted.length), ledgerDigest: digest }
}

export async function verifyDataPayload(root, payload, text) {
  if (payload.format !== 'wiki-data-change/1' || !/^[a-f0-9]{40}$/.test(payload.baseCommit ?? '')
    || !payload.actor?.trim() || !payload.reason?.trim() || !/^[a-z0-9][a-z0-9_-]{0,79}$/.test(payload.changeId ?? '')
    || !hashPattern.test(payload.baseSeedManifestSha256) || !hashPattern.test(payload.targetSeedManifestSha256)
    || sha256(jsonBytes(payload.delta)) !== payload.rowDeltaSha256) fail('E_PROVENANCE_PAYLOAD')
  const prefix = 'scripts/postgres-migration/schema-pg/'
  const catalog = schemaCatalog(await gitRead(root, payload.baseCommit, prefix + 'tables.sql'), await gitRead(root, payload.baseCommit, prefix + 'constraints.sql'))
  const manifestText = await gitRead(root, payload.baseCommit, 'db/seeds/manifest.json')
  if (sha256(manifestText) !== payload.baseSeedManifestSha256) fail('E_PROVENANCE_BASE_MANIFEST')
  const base = await readSeedSnapshot({ manifestText, read: f => gitRead(root, payload.baseCommit, 'db/seeds/' + f), catalog, baseline: true })
  const next = await readSeedSnapshot({ manifestText, read: f => Object.hasOwn(payload.targetFiles, f) ? payload.targetFiles[f] : gitRead(root, payload.baseCommit, 'db/seeds/' + f), catalog })
  const changes = diffSnapshots(base, next, catalog)
  await validateDomains(next, changes)
  const reconstructed = buildPayload({ base, next, changes, catalog, baseRef: payload.baseCommit, actor: payload.actor, reason: payload.reason, changeId: payload.changeId })
  if (jsonBytes(reconstructed) !== jsonBytes(payload) || migrationSql(reconstructed) !== text) fail('E_PROVENANCE_REPRODUCTION')
  return payload
}

export async function readMigrationInventory({ root = projectRoot } = {}) {
  const folder = resolve(root, 'db/migrations'), meta = resolve(folder, 'meta')
  const journal = JSON.parse(await readFile(resolve(meta, '_journal.json'), 'utf8'))
  if (journal.version !== '7' || journal.dialect !== 'postgresql' || !Array.isArray(journal.entries)) fail('E_PROVENANCE_JOURNAL')
  const tags = new Set(), times = new Set(), hashes = new Set(), ids = new Set(), changeIds = new Set(), entries = []
  let previousId = '00000000-0000-0000-0000-000000000000', previousWhen = 0
  for (const [i, entry] of journal.entries.entries()) {
    if (entry.idx !== i || entry.version !== '7' || entry.breakpoints !== true
      || !new RegExp(`^${String(i).padStart(4, '0')}_[a-zA-Z0-9_-]+$`).test(entry.tag)
      || tags.has(entry.tag) || !Number.isSafeInteger(entry.when) || entry.when <= previousWhen || times.has(entry.when)) fail('E_PROVENANCE_JOURNAL')
    tags.add(entry.tag); times.add(entry.when); previousWhen = entry.when
    const snapshotPath = resolve(meta, `${String(i).padStart(4, '0')}_snapshot.json`)
    if ((await lstat(snapshotPath)).isSymbolicLink()) fail('E_PROVENANCE_SYMLINK')
    const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'))
    if (snapshot.version !== '7' || snapshot.dialect !== 'postgresql' || snapshot.prevId !== previousId
      || !/^[a-f0-9-]{36}$/.test(snapshot.id ?? '') || ids.has(snapshot.id)) fail('E_PROVENANCE_META')
    previousId = snapshot.id; ids.add(snapshot.id)
    const path = resolve(folder, `${entry.tag}.sql`)
    if ((await lstat(path)).isSymbolicLink()) fail('E_PROVENANCE_SYMLINK')
    const text = await readFile(path, 'utf8'), hash = sha256(text)
    if (!text.trim() || hashes.has(hash)) fail('E_PROVENANCE_SQL_DUPLICATE')
    hashes.add(hash)
    let payload
    const header = /^-- wiki-data-change\/1 ([a-f0-9]+)\n/.exec(text)
    if (entry.tag.includes('_data_') || header) {
      if (!header) fail('E_PROVENANCE_DATA_HEADER')
      const claimed = JSON.parse(Buffer.from(header[1], 'hex').toString('utf8'))
      if (!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(claimed.changeId ?? '') || changeIds.has(claimed.changeId)) fail('E_PROVENANCE_DATA_HEADER')
      changeIds.add(claimed.changeId)
      const bytes = await readFile(resolve(root, 'db/data-changes', `${claimed.changeId}.json`), 'utf8')
      if (sha256(bytes) !== claimed.metadataSha256) fail('E_PROVENANCE_METADATA_HASH')
      payload = await verifyDataPayload(root, JSON.parse(bytes), text)
    }
    entries.push({ ...entry, hash, text, sql: text.split('--> statement-breakpoint'), payload })
  }
  for (const file of await readdir(folder)) if (file.endsWith('.sql') && !tags.has(file.slice(0, -4))) fail('E_PROVENANCE_SQL_ORPHAN', file)
  const allowedMeta = new Set(['_journal.json', ...entries.map(e => `${String(e.idx).padStart(4, '0')}_snapshot.json`)])
  for (const file of await readdir(meta)) if (!allowedMeta.has(file)) fail('E_PROVENANCE_META_ORPHAN', file)
  let metadataFiles = []
  try { metadataFiles = await readdir(resolve(root, 'db/data-changes')) } catch (e) { if (e.code !== 'ENOENT') throw e }
  for (const file of metadataFiles) if (file.endsWith('.json') && !changeIds.has(file.slice(0, -5))) fail('E_PROVENANCE_METADATA_ORPHAN')
  const pinned = readMigrationFiles({ migrationsFolder: folder })
  if (pinned.length !== entries.length || pinned.some((m, i) => m.hash !== entries[i].hash || m.folderMillis !== entries[i].when || JSON.stringify(m.sql) !== JSON.stringify(entries[i].sql))) fail('E_PROVENANCE_DRIZZLE')
  return entries
}

export async function readLedger(client) {
  const present = await client.query("SELECT to_regclass('wiki_migrations.__drizzle_migrations') AS ledger")
  if (!present.rows[0].ledger) return []
  return (await client.query('SELECT hash, created_at FROM wiki_migrations.__drizzle_migrations ORDER BY created_at, id')).rows
}

export function verifySnapshot(snapshot, { entries, seedManifestText, renderManifestText }) {
  const expectedKeys = ['format', 'producerCodeSha', 'seedManifestSha256', 'ledgerDigest', 'renderInventorySha256'].sort()
  if (JSON.stringify(Object.keys(snapshot).sort()) !== JSON.stringify(expectedKeys)
    || snapshot.format !== 'wiki-public-snapshot/1' || !/^[a-f0-9]{40}$/.test(snapshot.producerCodeSha ?? '')
    || snapshot.seedManifestSha256 !== sha256(seedManifestText)
    || snapshot.renderInventorySha256 !== sha256(renderManifestText)
    || snapshot.ledgerDigest !== ledgerDigest(entries)) fail('E_PROVENANCE_SNAPSHOT')
  return { ok: true, ledgerDigest: snapshot.ledgerDigest, seedManifestSha256: snapshot.seedManifestSha256, renderInventorySha256: snapshot.renderInventorySha256 }
}

export async function checkProvenance({ root = projectRoot, offline = false, snapshotPath = 'db/provenance/public-snapshot.json', executor } = {}) {
  const entries = await readMigrationInventory({ root })
  const seedManifestText = await readFile(resolve(root, 'db/seeds/manifest.json'), 'utf8')
  const catalog = schemaCatalog(await readFile(resolve(root, 'scripts/postgres-migration/schema-pg/tables.sql'), 'utf8'), await readFile(resolve(root, 'scripts/postgres-migration/schema-pg/constraints.sql'), 'utf8'))
  const seeds = await readSeedSnapshot({ manifestText: seedManifestText, read: f => readFile(resolve(root, 'db/seeds', f), 'utf8'), catalog, baseline: true })
  const renderManifestText = await readFile(resolve(root, 'renders/manifest.json'), 'utf8')
  const snapshot = JSON.parse(await readFile(resolve(root, snapshotPath), 'utf8'))
  const result = verifySnapshot(snapshot, { entries, seedManifestText, renderManifestText })
  if (offline) return { ...result, mode: 'offline', observation: 'recorded-projection-only', migrations: entries.length }
  const exec = executor ?? (process.env.WIKI_SEEDS_PSQL?.trim() ? makePsqlExecutor(process.env.WIKI_SEEDS_PSQL) : await makePgExecutor())
  if (!exec) fail('E_PROVENANCE_CONFIG', 'WIKI_SEEDS_PG[_FILE] or WIKI_SEEDS_PSQL required')
  try {
    const ledger = (await exec.jsonLines(jsonLines('SELECT hash, created_at FROM wiki_migrations.__drizzle_migrations ORDER BY created_at, id'))).map(JSON.parse)
    verifyLedger(entries, ledger)
    for (const table of seeds.manifest.tables) {
      const lines = await exec.jsonLines(jsonLines(`SELECT ${table.columns.map(quoteIdent).join(', ')} FROM wiki.${quoteIdent(table.table)} ORDER BY ${table.primary_key.map(quoteIdent).join(', ')}`))
      let offset = 0
      for (const file of table.files) {
        const text = `${lines.slice(offset, offset + file.rows).join('\n')}\n`
        if (sha256(text) !== file.sha256) fail('E_PROVENANCE_LIVE_SEEDS', table.table)
        offset += file.rows
      }
      if (offset !== lines.length) fail('E_PROVENANCE_LIVE_SEEDS', table.table)
    }
    return { ...result, mode: 'live', observation: 'sequential-read-only-not-shared-snapshot', migrations: entries.length }
  } finally { if (!executor) await exec.close() }
}

async function main(argv) {
  if (argv.length === 1 && argv[0] === '--help') { console.log('Usage: node scripts/check-migration-provenance.mjs [--offline] [--snapshot <path>] [--report <path>]'); return }
  const opts = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--offline') opts.offline = true
    else if (['--snapshot', '--report'].includes(argv[i]) && argv[i + 1]) opts[argv[i].slice(2)] = argv[++i]
    else fail('E_PROVENANCE_ARGS')
  }
  const result = await checkProvenance({ offline: opts.offline, snapshotPath: opts.snapshot })
  if (opts.report) await writeFile(resolve(opts.report), jsonBytes(result))
  console.log(JSON.stringify(result))
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2)).catch(error => { console.error(sanitizeError(error)); process.exitCode = 1 })
