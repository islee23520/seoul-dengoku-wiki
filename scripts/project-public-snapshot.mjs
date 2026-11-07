import { randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { lstat, mkdir, open, readFile, rename, rm } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { exportSeeds } from './seed-export.mjs'
import { connectionString, sanitizeError } from './seed-core.mjs'
import { assertSnapshotBinding } from './seed-lossless.mjs'
import { readPublicAdmission, readSeedClosure } from './public-admission.mjs'
import { jsonBytes, regularBytes, renderExport, safePath, sha256, treeFiles } from './render-export.mjs'
import { checkRenderSnapshot } from './check-render-snapshot.mjs'

const exec = promisify(execFile)
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const missing = error => { if (error.code === 'ENOENT') return null; throw error }
const digest = bytes => `sha256:${sha256(bytes)}`

export function ledgerDigest(hashes) {
  if (!Array.isArray(hashes) || hashes.some(hash => !/^[a-f0-9]{64}$/u.test(hash)) || new Set(hashes).size !== hashes.length) throw new Error('E_PUBLIC_LEDGER_HASH')
  return digest([...hashes].sort().join('\n'))
}

export function publicReceipt({ producerCodeRef, producedAt, seedManifestSha256, renderManifestSha256, checkedBuildArtifactDigest }) {
  if (!/^[a-f0-9]{40}$/u.test(producerCodeRef) || typeof producedAt !== 'string' || !Number.isFinite(Date.parse(producedAt))
    || ![seedManifestSha256, renderManifestSha256, checkedBuildArtifactDigest].every(value => /^sha256:[a-f0-9]{64}$/u.test(value))) throw new Error('E_PUBLIC_RECEIPT')
  return { format: 'wiki-public-snapshot/1', producerCodeRef, producedAt, seedManifestSha256, renderManifestSha256, checkedBuildArtifactDigest }
}

export async function producerTimestamp(root, codeRef) {
  if (!/^[a-f0-9]{40}$/u.test(codeRef)) throw new Error('E_PUBLIC_CODE_REF')
  return (await exec('git', ['-C', root, 'show', '-s', '--format=%cI', codeRef], { encoding: 'utf8' })).stdout.trim()
}

export async function atomicJson(path, value, mode = 0o600) {
  const temporary = `${path}.${randomUUID()}.next`
  const handle = await open(temporary, 'wx', mode)
  try {
    await handle.writeFile(jsonBytes(value))
    await handle.sync()
  } finally { await handle.close() }
  try { await rename(temporary, path) }
  finally { await rm(temporary, { force: true }) }
}

async function literalDirectories(root, directory) {
  let cursor = resolve(root)
  const parts = relative(cursor, directory).split(/[\\/]/u).filter(Boolean)
  for (const part of parts) {
    if (part === '..') throw new Error('E_PUBLIC_PROMOTION_PATH')
    cursor = join(cursor, part)
    const info = await lstat(cursor).catch(missing)
    if (info && (!info.isDirectory() || info.isSymbolicLink())) throw new Error('E_PUBLIC_PROMOTION_FILE')
    if (!info) await mkdir(cursor)
  }
}

// Command-boundary recovery: leave a blocking journal on any interrupted
// replacement. A subsequent complete export replaces every file before clearing
// it; consumers must reject the pending marker rather than read a mixed tree.
export async function promoteSnapshot({ stage, out, checkpoint = async () => {} }) {
  const files = await treeFiles(stage)
  if (!files.includes('db/seeds/manifest.json') || !files.includes('renders/manifest.json') || !files.includes('db/provenance/public-snapshot.json')) throw new Error('E_PUBLIC_STAGE_INCOMPLETE')
  const journal = join(out, '.promote-pending.json')
  const previous = await readFile(journal, 'utf8').then(JSON.parse).catch(missing)
  const oldFiles = new Set(previous?.files ?? [])
  for (const [path, base] of [['db/seeds/manifest.json', 'db/seeds'], ['renders/manifest.json', 'renders']]) {
    const old = await readFile(join(out, path), 'utf8').then(JSON.parse).catch(missing)
    for (const row of old?.tables?.flatMap(table => table.files) ?? old?.files?.filter(row => row.storage === 'snapshot') ?? []) oldFiles.add(`${base}/${row.file ?? row.path}`)
  }
  for (const path of [...files, ...oldFiles]) {
    safePath(path)
    if (!/^(?:db\/seeds\/|renders\/|db\/provenance\/public-snapshot\.json$)/u.test(path)) throw new Error('E_PUBLIC_PROMOTION_PATH')
  }
  await mkdir(out, { recursive: true })
  await atomicJson(journal, { format: 'wiki-public-promotion/1', files: [...new Set([...files, ...oldFiles])].sort() })
  await literalDirectories(out, join(out, 'db/seeds'))
  await atomicJson(join(out, 'db/seeds/.promote-pending.json'), { pending: true })
  await checkpoint('prepared')
  // Public receipt is the final replacement, never an early success marker.
  files.sort((a, b) => a === 'db/provenance/public-snapshot.json' ? 1 : b === 'db/provenance/public-snapshot.json' ? -1 : a < b ? -1 : a > b ? 1 : 0)
  for (const path of files) {
    const target = join(out, path)
    await literalDirectories(out, dirname(target))
    const info = await lstat(target).catch(missing)
    if (info && (!info.isFile() || info.isSymbolicLink())) throw new Error('E_PUBLIC_PROMOTION_FILE')
    await rename(join(stage, path), target)
    await checkpoint('promotion', path)
  }
  for (const path of oldFiles) if (!files.includes(path)) {
    await literalDirectories(out, dirname(join(out, path)))
    await rm(join(out, path), { force: true })
  }
  await rm(join(out, 'db/seeds/.promote-pending.json'))
  await rm(journal)
  await rm(stage, { recursive: true })
}

export async function compareSnapshot({ stage, out }) {
  if (await lstat(join(out, '.promote-pending.json')).catch(missing)) throw new Error('E_PUBLIC_PROMOTE_PENDING')
  let changedBytes = 0
  for (const path of await treeFiles(stage)) {
    const next = await regularBytes(stage, path)
    const old = await regularBytes(out, path).catch(missing)
    if (!old || sha256(next) !== sha256(old)) changedBytes += next.length
  }
  if (changedBytes) throw Object.assign(new Error('E_PUBLIC_SNAPSHOT_DRIFT'), { changedBytes })
  return { changedBytes: 0 }
}

async function appliedLedger(tx, root) {
  const journal = JSON.parse(await regularBytes(root, 'db/migrations/meta/_journal.json'))
  const expected = []
  for (const entry of journal.entries) {
    if (!/^[\w-]+$/u.test(entry.tag)) throw new Error('E_PUBLIC_LEDGER_JOURNAL')
    expected.push({ hash: sha256(await regularBytes(root, `db/migrations/${entry.tag}.sql`)), when: String(entry.when) })
  }
  const applied = await tx.all('SELECT hash, created_at::text AS "when" FROM wiki_migrations.__drizzle_migrations ORDER BY created_at, id')
  if (JSON.stringify(applied.map(row => [row.hash, row.when])) !== JSON.stringify(expected.map(row => [row.hash, row.when]))) throw new Error('E_PUBLIC_LEDGER_MISMATCH')
  return ledgerDigest(applied.map(row => row.hash))
}

function externalReceiptPath(path, root, out) {
  const target = resolve(path)
  for (const base of [root, out]) {
    const rel = relative(base, target)
    if (!isAbsolute(rel) && rel !== '..' && !rel.startsWith('../') && !rel.startsWith('..\\')) throw new Error('E_PUBLIC_HOST_RECEIPT_PATH')
  }
  return target
}

export async function projectPublicSnapshot({ out, check = false, scratchOnly = false, codeRef, root = projectRoot }) {
  if (!out || !/^[a-f0-9]{40}$/u.test(codeRef)) throw new Error('E_PUBLIC_ARGUMENT')
  root = resolve(root); out = resolve(out)
  const hostPath = process.env.WIKI_PROJECTION_HOST_RECEIPT_FILE
    ? externalReceiptPath(process.env.WIKI_PROJECTION_HOST_RECEIPT_FILE, root, out) : null
  const head = (await exec('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' })).stdout.trim()
  if (head !== codeRef) throw new Error('E_PUBLIC_CODE_REF')
  const dirty = (await exec('git', ['-C', root, 'status', '--porcelain', '--', 'scripts', 'server', 'src', 'package.json', 'package-lock.json', 'artifact-allowlist.json', 'vite.config.ts', 'tsconfig.json', 'db/migrations'], { encoding: 'utf8' })).stdout
  if (dirty.trim()) throw new Error('E_PUBLIC_CODE_DIRTY')
  const producedAt = await producerTimestamp(root, codeRef)
  if (process.env.WIKI_SEEDS_PSQL?.trim()) throw new Error('E_SEED_PSQL_SNAPSHOT_UNSUPPORTED')
  const { createReader } = await import('./cast-sqlite/db-pg.mjs')
  const { runRelease } = await import('./generate-release.mjs')
  if (scratchOnly) {
    const reader = createReader({ role: 'wiki_reader' })
    try { if (!/^seoul_scratch_[a-z0-9_]+$/u.test((await reader.get('SELECT current_database() AS database')).database)) throw new Error('E_PUBLIC_SCRATCH_REQUIRED') }
    finally { await reader.close() }
  }
  const runId = randomUUID(), started = performance.now()
  await mkdir(out, { recursive: true })
  const stage = join(out, '.public-snapshot-stage')
  let ownsStage = false
  try {
    let hostReceipt
    const result = await runRelease({ root, checkedBuild: true, afterChecked: async ({ receipt, snapshot, reader }) => {
      // Recovery is inside the release lock, so a second projector cannot
      // delete a first projector's active staging tree.
      const oldStage = await lstat(stage).catch(missing)
      if (oldStage && (!oldStage.isDirectory() || oldStage.isSymbolicLink())) throw new Error('E_PUBLIC_STAGE_FILE')
      await rm(stage, { recursive: true, force: true })
      await mkdir(stage, { mode: 0o700 })
      ownsStage = true
      const seedUrl = connectionString()
      const seedReader = seedUrl ? createReader({ connectionString: seedUrl }) : reader
      try {
        return await seedReader.transaction(async tx => {
          const identity = await tx.get('SELECT current_database() AS database, (SELECT oid::text FROM pg_database WHERE datname=current_database()) AS "databaseOid"')
          assertSnapshotBinding(snapshot, { id: snapshot.id, ...identity })
          if (scratchOnly && !/^seoul_scratch_[a-z0-9_]+$/u.test(identity.database)) throw new Error('E_PUBLIC_SCRATCH_REQUIRED')
          const admission = await readPublicAdmission(tx)
          const closure = await readSeedClosure(tx, admission)
          const ledger = await appliedLedger(tx, root)
          await exportSeeds({ out: join(stage, 'db/seeds'), closure, executor: { jsonLines: async sql => (await tx.all(sql)).map(row => row.line) } })
          await renderExport({ root, out: join(stage, 'renders'), admission, receipt })
          const report = await checkRenderSnapshot({ root, snapshot: join(stage, 'renders'), seeds: join(stage, 'db/seeds'), admission })
          const fields = { producerCodeRef: codeRef, seedManifestSha256: report.seedManifestSha256, renderManifestSha256: report.renderManifestSha256, checkedBuildArtifactDigest: receipt.checkedBuildArtifactDigest }
          const provenance = publicReceipt({ ...fields, producedAt })
          await mkdir(join(stage, 'db/provenance'), { recursive: true })
          await atomicJson(join(stage, 'db/provenance/public-snapshot.json'), provenance, 0o644)
          hostReceipt = { ledgerDigest: ledger, producerCodeRef: codeRef }
          if (check) {
            await compareSnapshot({ stage, out })
            await checkRenderSnapshot({ root, snapshot: join(out, 'renders'), seeds: join(out, 'db/seeds'), admission })
          } else await promoteSnapshot({ stage, out })
          return { ...report, checkedBuildArtifactDigest: receipt.checkedBuildArtifactDigest, changedBytes: check ? 0 : undefined }
        }, { readOnly: true, importSnapshot: snapshot.id })
      } finally {
        try { if (seedReader !== reader) await seedReader.close() }
        finally {
          await rm(stage, { recursive: true, force: true })
          ownsStage = false
        }
      }
    } })
    // Neither public staging nor Git receives this host-only sidecar. The exact
    // two-field shape is consumed by the P4 refresh wrapper.
    await atomicJson(join(root, 'src/generated-private/projection-run-receipt.json'), { ...hostReceipt, runId, timers: { totalMs: Math.round(performance.now() - started) } })
    if (hostPath) await atomicJson(hostPath, hostReceipt)
    return result
  } finally { if (ownsStage) await rm(stage, { recursive: true, force: true }) }
}

async function cli() {
  const args = process.argv.slice(2), options = {}
  if (args.length === 1 && args[0] === '--help') { console.log('Usage: node scripts/project-public-snapshot.mjs --out DIR --code-ref SHA [--check] [--scratch-only]\nRequires protected PostgreSQL generation readers. All reads share one exported snapshot.'); return }
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--check') options.check = true
    else if (args[i] === '--scratch-only') options.scratchOnly = true
    else if (['--out', '--code-ref'].includes(args[i]) && args[i + 1] && !args[i + 1].startsWith('--')) options[args[i] === '--out' ? 'out' : 'codeRef'] = args[++i]
    else throw new Error('E_PUBLIC_ARGUMENT')
  }
  console.log(JSON.stringify(await projectPublicSnapshot(options)))
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) cli().catch(error => { console.error(sanitizeError(error)); process.exitCode = 1 })
