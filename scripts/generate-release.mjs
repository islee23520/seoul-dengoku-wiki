import { appendFile, copyFile, lstat, mkdir, open, readFile, readdir, realpath, rename, rm, stat, unlink } from 'node:fs/promises'
import { constants, createReadStream } from 'node:fs'
import { createHash } from 'node:crypto'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadMapDataInput } from './map-data-input.mjs'
import { createReader, hasPgConnection, hasPrivatePgConnection } from './cast-sqlite/db-pg.mjs'

// Fixed-path readers cannot observe a cross-directory atomic swap. This is a
// recoverable command boundary, not filesystem-wide atomicity. Only cooperating
// generate/build commands take the lock; dev servers and direct tsc/vite readers
// must be stopped during release. Source editors do not participate in this lock.
const transactionName = '.generate-release-transaction'
const manifestName = 'src/generated-private/generation-release-manifest.json'
const evidenceName = '.omo/evidence/station-line-facts/adjacency-coverage.json'
const outputRoots = ['public', 'src/generated', 'src/generated-private']
const absent = error => { if (error.code === 'ENOENT') return null; throw error }

function outputPath(path) {
  if (typeof path !== 'string' || path.includes('\\') || path.split('/').some(part => !part || part === '.' || part === '..')
    || !(path === evidenceName || outputRoots.some(root => path.startsWith(root + '/')))) throw new Error('E_RELEASE_PATH:' + path)
  return path
}

// Evidence belongs to the shared ledger, which a worktree reaches through a
// directory symlink. Only the evidence path may cross one, and only when the
// link resolves to a real directory on the release root's device outside every
// published output root. Published roots and the evidence file itself stay literal.
async function ledgerDirectory(root, cursor, path) {
  if (path !== evidenceName) throw new Error('E_RELEASE_FILE:' + path)
  const base = await realpath(root)
  const real = await realpath(cursor).catch(absent)
  const info = real && await stat(real).catch(absent)
  if (!info?.isDirectory() || info.dev !== (await stat(base)).dev
    || outputRoots.some(output => real === join(base, output) || real.startsWith(join(base, output) + sep))) throw new Error('E_RELEASE_FILE:' + path)
}

async function regular(root, path) {
  const target = join(root, outputPath(path))
  let cursor = root
  for (const part of path.split('/')) {
    cursor = join(cursor, part)
    const info = await lstat(cursor).catch(absent)
    if (!info) return null
    if (info.isSymbolicLink()) {
      if (cursor === target) throw new Error('E_RELEASE_FILE:' + path)
      await ledgerDirectory(root, cursor, path)
    } else if (cursor === target ? !info.isFile() : !info.isDirectory()) throw new Error('E_RELEASE_FILE:' + path)
  }
  return target
}

async function hash(root, path) {
  const target = await regular(root, path)
  if (!target) return null
  const value = createHash('sha256')
  for await (const chunk of createReadStream(target)) value.update(chunk)
  return value.digest('hex')
}

async function syncDirectory(path) {
  const handle = await open(path, 'r')
  try { await handle.sync() } finally { await handle.close() }
}

async function durableJson(path, value) {
  const temporary = path + '.next'
  const handle = await open(temporary, 'w', 0o600)
  try { await handle.writeFile(JSON.stringify(value) + '\n'); await handle.sync() } finally { await handle.close() }
  await rename(temporary, path)
  await syncDirectory(dirname(path))
}

async function copy(source, target) {
  await mkdir(dirname(target), { recursive: true })
  await copyFile(source, target, constants.COPYFILE_FICLONE)
}

async function inventory(root) {
  const files = {}
  const device = (await lstat(root)).dev
  async function walk(path) {
    const info = await lstat(join(root, path)).catch(absent)
    if (!info) return
    if (info.isSymbolicLink()) throw new Error('E_RELEASE_FILE:' + path)
    if (info.dev !== device) throw new Error('E_RELEASE_FILESYSTEM:' + path)
    if (info.isDirectory()) {
      for (const name of (await readdir(join(root, path))).sort()) await walk(path + '/' + name)
    } else if (info.isFile()) files[outputPath(path)] = await hash(root, path)
    else throw new Error('E_RELEASE_FILE:' + path)
  }
  for (const path of [...outputRoots, evidenceName]) await walk(path)
  return files
}

// Python is already required by the physical-rail generator. flock is kernel
// owned, never reclaimed by PID guessing and released even on process death.
// The broker waits for each worker; parent death cannot unlock a running worker.
// Workers inherit the descriptor, keeping the lock if the broker itself dies.
const lockBroker = `import os, sys, fcntl, json, subprocess
fd = os.open(sys.argv[1], os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
try:
    fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
except BlockingIOError:
    print(json.dumps({'error': 'E_RELEASE_LOCKED'}), flush=True)
    sys.exit(73)
print(json.dumps({'ready': True}), flush=True)
for line in sys.stdin:
    request = json.loads(line)
    result = subprocess.run(request['command'], cwd=request['root'], env=request['env'], stdin=subprocess.DEVNULL, stdout=sys.stderr, stderr=sys.stderr, pass_fds=(fd,))
    print(json.dumps({'code': result.returncode}), flush=True)
`

export async function withReleaseLock(root, action) {
  const child = spawn('python3', ['-u', '-c', lockBroker, join(root, '.generate-release.lock')], { stdio: ['pipe', 'pipe', 'inherit'] })
  const lines = createInterface({ input: child.stdout })
  let pending
  let failure
  const closed = new Promise(resolveClosed => {
    child.on('error', error => { failure = error; pending?.reject(error); resolveClosed() })
    child.on('exit', (code, signal) => {
      failure ??= new Error(`E_RELEASE_LOCK_EXIT:${code}:${signal}`)
      pending?.reject(failure)
      resolveClosed()
    })
  })
  lines.on('line', line => {
    const reply = JSON.parse(line)
    if (reply.error) pending?.reject(new Error(reply.error))
    else pending?.resolve(reply)
    pending = null
  })
  const next = () => failure ? Promise.reject(failure) : new Promise((resolveReply, reject) => { pending = { resolve: resolveReply, reject } })
  try {
    await next()
    return await action(async (command, env = process.env) => {
      const reply = next()
      child.stdin.write(JSON.stringify({ command, root, env }) + '\n')
      const { code } = await reply
      if (code !== 0) throw new Error(`E_RELEASE_WORKER:${command.join(' ')}:${code}`)
    })
  } finally {
    child.stdin.end()
    await closed
    lines.close()
  }
}

// Workers have no live-output mode. The publication check belongs before this
// context is opened, so a pending review remains the first generator failure.
export async function generatorStage(projectRoot) {
  const transaction = join(resolve(projectRoot), transactionName)
  if (process.env.WIKI_GENERATION_STAGE !== join(transaction, 'stage')) throw new Error('E_RELEASE_STAGE_REQUIRED')
  const context = JSON.parse(await readFile(join(transaction, 'context.json'), 'utf8'))
  if (context.token !== process.env.WIKI_GENERATION_TOKEN) throw new Error('E_RELEASE_STAGE_TOKEN')
  const root = join(transaction, 'stage')
  return {
    root,
    async writeFile(path, bytes, options) {
      const name = outputPath(relative(root, resolve(path)))
      await regular(root, name)
      const handle = await open(path, 'w')
      try { await handle.writeFile(bytes, options) } finally { await handle.close() }
      await appendFile(join(transaction, 'outputs.jsonl'), JSON.stringify(name) + '\n')
    },
  }
}

function checkJournal(journal) {
  if (journal?.schema !== 1 || !['prepared', 'promoting', 'committed', 'rolling-back', 'rolled-back'].includes(journal.state) || !Array.isArray(journal.files)) throw new Error('E_RELEASE_JOURNAL')
  const seen = new Set()
  for (const row of journal.files) {
    outputPath(row.path)
    if (seen.has(row.path) || ![row.old, row.new].every(value => value === null || /^[a-f0-9]{64}$/u.test(value))) throw new Error('E_RELEASE_JOURNAL')
    seen.add(row.path)
  }
}

async function recover(root, checkpoint) {
  const transaction = join(root, transactionName)
  const info = await lstat(transaction).catch(absent)
  if (!info) return
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('E_RELEASE_TRANSACTION')
  const journal = await readFile(join(transaction, 'journal.json'), 'utf8').then(JSON.parse).catch(absent)
  if (!journal) { await rm(transaction, { recursive: true }); return }
  checkJournal(journal)
  // Preflight the entire rollback before changing anything. An editor's third
  // version is a conflict, never a reason to overwrite or discard the journal.
  for (const row of journal.files) {
    const actual = await hash(root, row.path)
    if (journal.state === 'committed' ? actual !== row.new : journal.state === 'rolled-back' ? actual !== row.old : actual !== row.old && actual !== row.new) throw new Error('E_RELEASE_CONFLICT:' + row.path)
    if (!['committed', 'rolled-back'].includes(journal.state) && row.old !== null && await hash(join(transaction, 'old'), row.path) !== row.old) throw new Error('E_RELEASE_BACKUP:' + row.path)
  }
  if (!['committed', 'rolled-back'].includes(journal.state)) {
    journal.state = 'rolling-back'
    await durableJson(join(transaction, 'journal.json'), journal)
    for (const row of [...journal.files].reverse()) {
      const actual = await hash(root, row.path)
      if (actual === row.old) continue
      if (actual !== row.new) throw new Error('E_RELEASE_CONFLICT:' + row.path)
      // Record rollback intent before the reversible per-file replacement.
      journal.intent = { action: 'restore', path: row.path }
      await durableJson(join(transaction, 'journal.json'), journal)
      if (row.old === null) await unlink(join(root, row.path))
      else {
        const restore = join(transaction, 'restore', row.path)
        await copy(join(transaction, 'old', row.path), restore)
        await rename(restore, join(root, row.path))
      }
      await syncDirectory(dirname(join(root, row.path)))
      await checkpoint('recovery', row.path)
    }
    journal.state = 'rolled-back'
    journal.intent = null
    await durableJson(join(transaction, 'journal.json'), journal)
  }
  await rm(transaction, { recursive: true })
  await syncDirectory(root)
}

async function hasRecoveryJournal(root) {
  const transaction = join(root, transactionName)
  const info = await lstat(transaction).catch(absent)
  if (!info) return false
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('E_RELEASE_TRANSACTION')
  const journal = await lstat(join(transaction, 'journal.json')).catch(absent)
  if (!journal) return false
  if (!journal.isFile() || journal.isSymbolicLink()) throw new Error('E_RELEASE_JOURNAL')
  return true
}

export async function recoverRelease({ root, checkpoint = async () => { } }) {
  root = resolve(root)
  // Restoring a prior release is not a new publication. With no journal this
  // command is read-only, even when an abandoned private stage still exists.
  if (!await hasRecoveryJournal(root)) return
  return withReleaseLock(root, async () => {
    if (await hasRecoveryJournal(root)) await recover(root, checkpoint)
  })
}

async function trackedHash(root, path) {
  // A first release may replace exact, unmodified tracked generated bytes. It
  // cannot replace an untracked file or a user's modified generated file.
  const child = spawn('git', ['-C', root, 'show', ':' + path], { stdio: ['ignore', 'pipe', 'ignore'] })
  const value = createHash('sha256')
  child.stdout.on('data', bytes => value.update(bytes))
  return new Promise((resolveHash, reject) => {
    child.on('error', reject)
    child.on('close', code => resolveHash(code === 0 ? value.digest('hex') : null))
  })
}

async function previousGeneration(root, before, ownership) {
  const manifest = await readFile(join(root, manifestName), 'utf8').then(JSON.parse).catch(absent)
  if (manifest) {
    if (manifest.schema !== 1 || !Array.isArray(manifest.files)) throw new Error('E_RELEASE_MANIFEST')
    const files = new Map()
    for (const row of manifest.files) {
      outputPath(row.path)
      if (files.has(row.path) || !/^[a-f0-9]{64}$/u.test(row.sha256) || row.path === manifestName) throw new Error('E_RELEASE_MANIFEST')
      files.set(row.path, row.sha256)
    }
    return files
  }
  // One-time bootstrap needs both an existing output index and exact Git bytes.
  // Merely being tracked under a generated directory is not retirement proof.
  const files = new Map()
  const candidates = new Set()
  for (const index of ['src/generated/publication-manifest.json', 'public/clan-crests/index.json']) {
    if (!before[index] || await ownership(root, index) !== before[index]) continue
    const value = JSON.parse(await readFile(join(root, index), 'utf8'))
    if (index.startsWith('src/')) {
      for (const row of value.documents ?? []) {
        if (!/^src\/generated\/world\/[^/]+\.json$/u.test(row.contentRef)) throw new Error('E_RELEASE_BOOTSTRAP')
        candidates.add(row.contentRef)
        // Retire previously owned English outputs during the Korean-only cutover.
        candidates.add(row.contentRef.replace('/world/', '/world-en/'))
      }
    } else {
      for (const row of value.crests ?? []) {
        if (!/^[a-z0-9-]+$/u.test(row.id)) throw new Error('E_RELEASE_BOOTSTRAP')
        candidates.add(`public/clan-crests/${row.id}.svg`)
      }
    }
  }
  for (const path of candidates) {
    if (before[path] && await ownership(root, path) === before[path]) files.set(path, before[path])
  }
  return files
}

export async function runRelease({ root, stage, consume, verifyOnly = false, checkpoint, ownership = trackedHash,
  mapRequestPath = process.env.WIKI_MAP_RELEASE_REQUEST }) {
  root = resolve(root)
  if (verifyOnly && (stage || consume || checkpoint || ownership !== trackedHash)) throw new Error('E_RELEASE_VERIFY_OVERRIDE')
  checkpoint ??= async () => { }
  if (verifyOnly && !hasPgConnection()) throw new Error('E_RELEASE_VERIFY_PG_REQUIRED')
  if (verifyOnly && !hasPrivatePgConnection()) throw new Error('E_GENERATION_PRIVATE_PG_REQUIRED')
  return withReleaseLock(root, async run => {
    // Verification must never recover or discard an earlier transaction: recovery
    // can modify live outputs and an abandoned stage may contain diagnostics.
    if (verifyOnly) {
      if (await lstat(join(root, transactionName)).catch(absent)) throw new Error('E_RELEASE_TRANSACTION')
    } else if (await hasRecoveryJournal(root)) await recover(root, checkpoint)
    const mapInput = mapRequestPath === undefined ? null : await loadMapDataInput(mapRequestPath)
    await mapInput?.recheck()
    if (!verifyOnly) await recover(root, checkpoint)
    let snapshotReader
    let generationSnapshot
    try {
      let sourceBinding
      let privateReceipts
      if (hasPgConnection()) {
        if (!hasPrivatePgConnection()) throw Object.assign(new Error('E_GENERATION_PRIVATE_PG_REQUIRED'), { code: 'E_GENERATION_PRIVATE_PG_REQUIRED' })
        snapshotReader = createReader({ role: 'wiki_reader' })
        generationSnapshot = await snapshotReader.exportSnapshot()
        const expected = JSON.parse(await readFile(join(root, 'scripts/postgres-migration/schema-pg/metadata.json'), 'utf8'))
        sourceBinding = await snapshotReader.transaction(async tx => {
          const rows = await tx.all('SELECT source_sha256, schema_version FROM wiki.meta WHERE migration_id = $1', [expected.migration_id])
          if (rows.length !== 1 || rows[0].source_sha256 !== expected.source_sha256
            || Number(rows[0].schema_version) !== Number(expected.schema_version)) throw new Error('E_RELEASE_PG_METADATA')
          const identity = await tx.all('SELECT current_database() AS database, (SELECT oid::text FROM pg_database WHERE datname = current_database()) AS database_oid')
          return {
            kind: 'postgresql', database: identity[0].database, databaseOid: identity[0].database_oid,
            migrationId: expected.migration_id, sourceSha256: rows[0].source_sha256, schemaVersion: Number(rows[0].schema_version)
          }
        }, { readOnly: true, importSnapshot: generationSnapshot.id })
        const privateReader = createReader({ role: 'wiki_generation_reader' })
        try {
          privateReceipts = await privateReader.transaction(async tx => {
            const identity = await tx.all('SELECT current_database() AS database, (SELECT oid::text FROM pg_database WHERE datname = current_database()) AS database_oid')
            if (identity[0].database !== sourceBinding.database || identity[0].database_oid !== sourceBinding.databaseOid) throw new Error('E_RELEASE_PG_DATABASE')
            const editorial = await tx.all('SELECT ordinal, logical_path, sha256, snapshot_sha256, profile_count FROM wiki_private.editorial_batch_source ORDER BY ordinal')
            const soul = await tx.all('SELECT singleton, source_sha256, snapshot_sha256, assignment_count FROM wiki_private.soul_revision ORDER BY singleton')
            const columns = await tx.all("SELECT column_name FROM information_schema.columns WHERE table_schema='wiki_private' AND table_name='soul_document' AND column_name='revision_id'")
            const imported = columns.length ? await tx.all('SELECT revision_id, source_sha256, snapshot_sha256, assignment_count, status FROM wiki_private.soul_edit_revision WHERE revision_id=0') : []
            const scope = 'editorial_batch_source,soul_revision,soul_edit_revision:imported-if-migrated'
            return { scope, sha256: createHash('sha256').update(JSON.stringify({ editorial, soul, imported })).digest('hex') }
          }, { readOnly: true, importSnapshot: generationSnapshot.id })
        } finally { await privateReader.close() }
      }
      const transaction = join(root, transactionName)
      const stageRoot = join(transaction, 'stage')
      const before = await inventory(root)
      const previousFiles = await previousGeneration(root, before, ownership)
      const databaseInputs = hasPgConnection() ? [] : [...new Set(['WIKI_DOCUMENT_DB', 'WIKI_PORTRAIT_DB',
        'WIKI_EDITORIAL_PROFILE_DB', 'WIKI_SOUL_ASSIGNMENT_DB',
        'WIKI_MAPPING_ORIGINAL_DB',
        'WIKI_MAPPING_FINAL_DB', 'WIKI_MAPPING_SOURCES_DB', 'WIKI_PUBLICATION_DATABASE_CONFIG'].map(key => process.env[key]).filter(Boolean))]
      if (!hasPgConnection() && process.env.WIKI_PUBLICATION_DATABASE_CONFIG) {
        const config = JSON.parse(await readFile(process.env.WIKI_PUBLICATION_DATABASE_CONFIG, 'utf8'))
        const capture = JSON.parse(await readFile(config.captureReceiptPath, 'utf8'))
        databaseInputs.push(...[config.databasePath, config.bootstrapReceiptPath, config.captureReceiptPath,
        capture.databasePath, config.editorialDatabasePath, ...Object.values(config.privateStores)]
          .filter(path => path && !databaseInputs.includes(path)))
      }
      const databaseHashes = new Map()
      for (const path of databaseInputs) {
        const value = createHash('sha256')
        for await (const bytes of createReadStream(path)) value.update(bytes)
        databaseHashes.set(path, value.digest('hex'))
      }
      await mkdir(transaction, { mode: 0o700 })
      let journal
      try {
        await mkdir(stageRoot)
        for (const path of Object.keys(before)) await copy(join(root, path), join(stageRoot, path))
        const token = createHash('sha256').update(`${process.pid}:${process.hrtime.bigint()}`).digest('hex')
        await durableJson(join(transaction, 'context.json'), { token, ...(sourceBinding ? { sourceBinding } : {}) })
        const env = {
          ...process.env, WIKI_GENERATION_STAGE: stageRoot, WIKI_GENERATION_TOKEN: token,
          ...(generationSnapshot ? { WIKI_GENERATION_SNAPSHOT: generationSnapshot.id } : {}),
          ...(mapInput ? { WIKI_MAP_RELEASE_REQUEST: mapRequestPath } : {})
        }
        // Workers run at root; keep relative protected paths bound to the
        // invoking process directory without copying connection contents.
        for (const key of ['WIKI_DOCUMENT_PG_FILE', 'WIKI_GENERATION_PRIVATE_PG_FILE']) {
          if (process.env[key]) env[key] = resolve(process.env[key])
        }
        const written = new Set()
        const write = async (path, bytes) => {
          outputPath(path)
          await regular(stageRoot, path)
          await mkdir(dirname(join(stageRoot, path)), { recursive: true })
          const handle = await open(join(stageRoot, path), 'w')
          try { await handle.writeFile(bytes) } finally { await handle.close() }
          written.add(path)
        }
        if (stage) await stage({ root: stageRoot, write, run: command => run(command, env), mapInput })
        else {
          await run([process.execPath, 'scripts/generate-clan-crests.mjs'], env)
          await checkpoint('crest')
          await run([process.execPath, 'scripts/generate-catalog.mjs'], env)
          await run([process.execPath, 'scripts/generate-portrait-source-catalog.mjs'], env)
          await run([process.execPath, 'scripts/generate-portrait-tokens.mjs'], env)
        }
        if (mapInput) await write('src/generated-private/map-input-receipt.json', JSON.stringify(mapInput.receipt) + '\n')
        const records = await readFile(join(transaction, 'outputs.jsonl'), 'utf8').catch(absent)
        for (const line of (records ?? '').split('\n').filter(Boolean)) written.add(outputPath(JSON.parse(line)))
        for (const [path, expected] of previousFiles) {
          if (written.has(path)) continue
          if (before[path] !== expected) throw new Error('E_RELEASE_CONFLICT:' + path)
          await unlink(join(stageRoot, path)).catch(absent)
        }
        const outputs = []
        for (const path of [...written].sort()) {
          const sha256 = await hash(stageRoot, path)
          if (!sha256) throw new Error('E_RELEASE_OUTPUT_MISSING:' + path)
          if (before[path] !== undefined && previousFiles.get(path) !== before[path]
            && await ownership(root, path) !== before[path]) throw new Error('E_RELEASE_UNOWNED:' + path)
          outputs.push({ path, sha256 })
        }
        const generationProvenance = sourceBinding ? {
          schema: 'wiki.pg-generation.v1', sourceBinding,
          privateReceipts: { scope: privateReceipts.scope, sha256: privateReceipts.sha256 },
          outputInventorySha256: createHash('sha256').update(JSON.stringify(outputs)).digest('hex'),
        } : undefined
        await write(manifestName, JSON.stringify({
          schema: 1, files: outputs,
          ...(generationProvenance ? { provenance: generationProvenance } : {})
        }) + '\n')
        const after = await inventory(stageRoot)
        const files = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort().flatMap(path => {
          const old = before[path] ?? null
          const next = after[path] ?? null
          return old === next ? [] : [{ path, old, new: next }]
        })
        if (verifyOnly) {
          // Check the same live ownership and source freshness preconditions as
          // promotion, but do not create backups or write any live output.
          for (const row of files) {
            if (await hash(root, row.path) !== row.old) throw new Error('E_RELEASE_CONFLICT:' + row.path)
            if (row.old !== null && row.path !== manifestName && previousFiles.get(row.path) !== row.old
              && await ownership(root, row.path) !== row.old) throw new Error('E_RELEASE_UNOWNED:' + row.path)
          }
          await mapInput?.recheck()
          const digest = createHash('sha256').update(JSON.stringify(Object.entries(after).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0))).digest('hex')
          const report = {
            schema: 1, mode: 'verify-pg', status: 'passed', generatedCount: outputs.length,
            inventoryCount: Object.keys(after).length, changedCount: files.length, inventorySha256: digest,
            sourceSha256: sourceBinding.sourceSha256, privateReceiptsSha256: privateReceipts.sha256,
            provenance: generationProvenance
          }
          console.log(JSON.stringify(report))
          await rm(transaction, { recursive: true })
          await syncDirectory(root)
          return report
        }
        for (const row of files) {
          if (await hash(root, row.path) !== row.old) throw new Error('E_RELEASE_CONFLICT:' + row.path)
          if (row.old !== null && row.path !== manifestName && previousFiles.get(row.path) !== row.old
            && await ownership(root, row.path) !== row.old) throw new Error('E_RELEASE_UNOWNED:' + row.path)
          if (row.old !== null) {
            await copy(join(root, row.path), join(transaction, 'old', row.path))
            const backup = await open(join(transaction, 'old', row.path), 'r')
            try { await backup.sync() } finally { await backup.close() }
            for (let directory = dirname(join(transaction, 'old', row.path)); directory !== transaction; directory = dirname(directory)) {
              await syncDirectory(directory)
            }
          }
          if (row.new !== null) {
            const staged = await open(join(stageRoot, row.path), 'r')
            try { await staged.sync() } finally { await staged.close() }
          }
        }
        await mapInput?.recheck()
        for (const [path, expected] of databaseHashes) {
          const value = createHash('sha256')
          for await (const bytes of createReadStream(path)) value.update(bytes)
          if (value.digest('hex') !== expected) throw new Error('E_RELEASE_DATABASE_CHANGED:' + path)
        }
        journal = {
          schema: 1, state: 'prepared', files, intent: null,
          ...(sourceBinding ? { sourceBinding, privateReceipts } : {})
        }
        await durableJson(join(transaction, 'journal.json'), journal)
        await checkpoint('prepared')
        for (const row of files) {
          if (await hash(root, row.path) !== row.old) throw new Error('E_RELEASE_CONFLICT:' + row.path)
          journal.state = 'promoting'
          journal.intent = { action: row.new === null ? 'retire' : 'replace', path: row.path }
          await durableJson(join(transaction, 'journal.json'), journal)
          await mkdir(dirname(join(root, row.path)), { recursive: true })
          for (let directory = dirname(join(root, row.path)); directory !== root; directory = dirname(directory)) {
            await syncDirectory(directory)
          }
          await syncDirectory(root)
          if (row.new === null) await unlink(join(root, row.path))
          else await rename(join(stageRoot, row.path), join(root, row.path))
          await syncDirectory(dirname(join(root, row.path)))
          await checkpoint('promotion', row.path)
        }
        journal.state = 'committed'
        journal.intent = null
        await durableJson(join(transaction, 'journal.json'), journal)
        await checkpoint('committed')
        await recover(root, checkpoint)
      } catch (error) {
        if (journal) {
          try { await recover(root, checkpoint) }
          catch (recoveryError) { throw new AggregateError([error, recoveryError], 'E_RELEASE_RECOVERY_REQUIRED') }
        } else if (verifyOnly) {
          // Retain the owned stage for diagnosis; never persist raw exceptions,
          // connection details, private source rows, or worker output.
          const code = typeof error.code === 'string' && /^E_[A-Z0-9_]+$/u.test(error.code)
            ? error.code : /^E_[A-Z0-9_]+/u.exec(error.message ?? '')?.[0] ?? 'E_RELEASE_VERIFY_FAILED'
          try { await durableJson(join(transaction, 'verify-report.json'), { schema: 1, mode: 'verify-pg', status: 'failed', code }) }
          catch (reportError) { throw new AggregateError([error, reportError], 'E_RELEASE_VERIFY_REPORT') }
        } else await rm(transaction, { recursive: true, force: true })
        throw error
      }
      // The lock stays held during both TypeScript and Vite reads, including every
      // worker subprocess. A compiler failure does not undo a committed release.
      if (consume) await consume(run)
    } finally {
      try { await generationSnapshot?.release() } finally { await snapshotReader?.close() }
    }
  })
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const args = process.argv.slice(2)
  if (args.length > 1 || args.length && !['--build', '--recover', '--verify-pg'].includes(args[0])) throw new Error('E_RELEASE_ARGUMENT')
  // Injected runRelease stages remain usable without a database.
  if (args[0] !== '--recover' && args[0] !== '--verify-pg' && !hasPgConnection()) {
    if (process.env.WIKI_MIGRATION_SQLITE !== '1') throw new Error('E_RELEASE_PG_REQUIRED: set WIKI_DOCUMENT_PG; SQLite diagnostics require WIKI_MIGRATION_SQLITE=1 and explicit WIKI_DOCUMENT_DB')
    if (!process.env.WIKI_DOCUMENT_DB?.trim()) throw new Error('E_RELEASE_MIGRATION_SQLITE_DB_REQUIRED: set explicit WIKI_DOCUMENT_DB')
  }
  if (args[0] === '--recover') await recoverRelease({ root })
  else await runRelease({
    root, verifyOnly: args[0] === '--verify-pg', consume: args[0] === '--build' ? async run => {
      await run([process.execPath, 'node_modules/typescript/bin/tsc', '-b'])
      await run([process.execPath, 'node_modules/vite/bin/vite.js', 'build'])
    } : undefined
  })
}
