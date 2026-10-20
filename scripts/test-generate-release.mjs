import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, readdir, rename, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { recoverRelease, runRelease, withReleaseLock } from './generate-release.mjs'

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const gate = async () => ({ complete: true, semanticReview: 'reviewed' })
const transaction = '.generate-release-transaction'
const evidence = '.omo/evidence/station-line-facts/adjacency-coverage.json'
const generated = [
  'public/clan-crests/family.svg',
  'src/generated/world/Article.json',
  'public/person-details/person-0001.json',
  'public/portrait-tokens/person-0001.json',
  'src/generated-private/feedback.json',
  evidence,
]

async function put(root, path, bytes) {
  await mkdir(dirname(join(root, path)), { recursive: true })
  await writeFile(join(root, path), bytes)
}

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'generation-release-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const owned = new Map()
  for (const path of generated) {
    const bytes = 'old:' + path
    await put(root, path, bytes)
    owned.set(path, sha256(bytes))
  }
  for (const path of ['src/generated/world/notes.json', 'public/clan-crests/user.svg', 'public/unknown.bin', 'src/content/handwritten.md']) await put(root, path, 'user:' + path)
  return { root, gate, ownership: async (_, path) => owned.get(path) ?? null }
}

async function live(root, directories = ['public', 'src', '.omo']) {
  const result = {}
  async function walk(directory) {
    for (const entry of await readdir(join(root, directory), { withFileTypes: true }).catch(error => {
      if (error.code === 'ENOENT') return []
      throw error
    })) {
      const path = directory + '/' + entry.name
      if (entry.isDirectory()) await walk(path)
      else result[path] = await readFile(join(root, path), 'utf8')
    }
  }
  for (const path of directories) await walk(path)
  return result
}

const stageAll = async ({ root, write }) => {
  for (const path of generated) await write(path, 'new:' + path)
  // The catalog reads the staged crest, not the previous live crest.
  await write('src/generated/crestCatalog.json', await readFile(join(root, generated[0])))
}

for (const [index, label] of ['early crest', 'early article', 'early detail', 'early portrait'].entries()) {
  test(`stage failure after ${label} preserves every live byte`, async t => {
    const options = await fixture(t)
    const before = await live(options.root)
    await assert.rejects(runRelease({ ...options, stage: async context => {
      for (const path of generated.slice(0, index + 1)) await context.write(path, 'partial')
      throw new Error('E_STAGE_FIXTURE')
    } }), /E_STAGE_FIXTURE/)
    assert.deepEqual(await live(options.root), before)
    await assert.rejects(readFile(join(options.root, transaction, 'context.json')), { code: 'ENOENT' })
  })
}

test('pending approval without a journal creates no lock or transaction and preserves abandoned staging', async t => {
  const options = await fixture(t)
  const before = await live(options.root)
  for (const abandonedStage of [false, true]) {
    if (abandonedStage) await put(options.root, transaction + '/stage/partial.json', 'leave this untouched')
    await assert.rejects(runRelease({ ...options, gate: async () => { throw new Error('E_SCOPE_PENDING') },
      stage: () => assert.fail('stage must not run'),
    }), /E_SCOPE_PENDING/)
    await recoverRelease({ ...options, gate: () => assert.fail('recovery must not ask for publication') })
    assert.deepEqual(await live(options.root), before)
    await assert.rejects(readFile(join(options.root, '.generate-release.lock')), { code: 'ENOENT' })
    if (abandonedStage) assert.equal(await readFile(join(options.root, transaction, 'stage/partial.json'), 'utf8'), 'leave this untouched')
    else await assert.rejects(readdir(join(options.root, transaction)), { code: 'ENOENT' })
  }
})

test('gate becoming stale after staging aborts before live promotion', async t => {
  const options = await fixture(t)
  let calls = 0
  const before = await live(options.root)
  await assert.rejects(runRelease({ ...options, stage: stageAll, gate: async () => {
    if (++calls === 3) throw new Error('semanticReview:not-reviewed')
  } }), /semanticReview:not-reviewed/)
  assert.equal(calls, 3)
  assert.deepEqual(await live(options.root), before)
})

test('successful release preserves unknown files and captures all output roots', async t => {
  const options = await fixture(t)
  const before = await live(options.root)
  await runRelease({ ...options, stage: stageAll })
  const after = await live(options.root)
  for (const path of generated) assert.equal(after[path], 'new:' + path)
  assert.equal(after['src/generated/crestCatalog.json'], 'new:' + generated[0])
  for (const path of Object.keys(before).filter(path => !generated.includes(path))) assert.equal(after[path], before[path])
  const manifest = JSON.parse(after['src/generated-private/generation-release-manifest.json'])
  assert.deepEqual(manifest.files.map(row => row.path), [...generated, 'src/generated/crestCatalog.json'].sort())
  // A later run retires precisely the previously recorded outputs, not unknown
  // neighbors in the same article/crest directories or handwritten src/content.
  await runRelease({ ...options, stage: async ({ write }) => { await write(generated[0], 'third crest') } })
  const retired = await live(options.root)
  assert.equal(retired[generated[0]], 'third crest')
  for (const path of generated.slice(1)) assert.equal(retired[path], undefined)
  for (const path of Object.keys(before).filter(path => !generated.includes(path))) assert.equal(retired[path], before[path])
})

test('unowned collisions and edited prior outputs abort without overwrites', async t => {
  const options = await fixture(t)
  const before = await live(options.root)
  for (const bytes of ['replacement', before['src/generated/world/notes.json']]) {
    await assert.rejects(runRelease({ ...options, stage: ({ write }) => write('src/generated/world/notes.json', bytes) }), /E_RELEASE_UNOWNED/)
    assert.deepEqual(await live(options.root), before)
  }
  await runRelease({ ...options, stage: stageAll })
  await put(options.root, generated[1], 'user edit after release')
  const edited = await live(options.root)
  await assert.rejects(runRelease({ ...options, stage: stageAll }), /E_RELEASE_UNOWNED/)
  assert.deepEqual(await live(options.root), edited)
})

test('first release retires only indexed and unchanged historical article and crest files', async t => {
  const options = await fixture(t)
  const indexes = {
    'src/generated/publication-manifest.json': JSON.stringify({ documents: [{ contentRef: generated[1] }] }),
    'public/clan-crests/index.json': JSON.stringify({ crests: [{ id: 'family' }] }),
  }
  await put(options.root, 'src/generated/world-en/Article.json', 'old English')
  for (const [path, bytes] of Object.entries(indexes)) await put(options.root, path, bytes)
  const before = await live(options.root)
  await runRelease({ ...options, ownership: async (_, path) => before[path] === undefined ? null : sha256(before[path]),
    stage: async ({ write }) => { await write('src/generated/peopleCount.ts', 'export const peopleCount = 0\n') },
  })
  const after = await live(options.root)
  assert.equal(after[generated[0]], undefined)
  assert.equal(after[generated[1]], undefined)
  assert.equal(after['src/generated/world-en/Article.json'], undefined)
  assert.equal(after['src/generated/world/notes.json'], before['src/generated/world/notes.json'])
  assert.equal(after['public/clan-crests/user.svg'], before['public/clan-crests/user.svg'])
})

test('promotion failure restores old files and removes newly promoted files', async t => {
  const options = await fixture(t)
  const before = await live(options.root)
  let promoted = 0
  await assert.rejects(runRelease({ ...options, stage: stageAll, checkpoint: async phase => {
    if (phase === 'promotion' && ++promoted === 5) throw new Error('E_PROMOTION_FIXTURE')
  } }), /E_PROMOTION_FIXTURE/)
  assert.equal(promoted, 5)
  assert.deepEqual(await live(options.root), before)
  await recoverRelease(options)
  assert.deepEqual(await live(options.root), before)
})

test('journal intent and old/new hashes precede each live replacement', async t => {
  const options = await fixture(t)
  const before = await live(options.root)
  await runRelease({ ...options, stage: stageAll, checkpoint: async (phase, path) => {
    if (phase !== 'promotion') return
    const journal = JSON.parse(await readFile(join(options.root, transaction, 'journal.json'), 'utf8'))
    const row = journal.files.find(row => row.path === path)
    assert.equal(journal.state, 'promoting')
    assert.equal(journal.intent.path, path)
    assert.equal(row.old, before[path] === undefined ? null : sha256(before[path]))
    assert.equal(row.new, sha256(await readFile(join(options.root, path))))
    if (row.old !== null) assert.equal(sha256(await readFile(join(options.root, transaction, 'old', path))), row.old)
  } })
})

test('interrupted rollback resumes idempotently from its persisted journal', async t => {
  const options = await fixture(t)
  const before = await live(options.root)
  let promoted = 0
  await assert.rejects(runRelease({ ...options, stage: stageAll, checkpoint: async phase => {
    if (phase === 'promotion' && ++promoted === 6) throw new Error('E_PROMOTION_FIXTURE')
    if (phase === 'recovery') throw new Error('E_RECOVERY_FIXTURE')
  } }), /E_RELEASE_RECOVERY_REQUIRED/)
  assert.equal(JSON.parse(await readFile(join(options.root, transaction, 'journal.json'), 'utf8')).state, 'rolling-back')
  await recoverRelease(options)
  assert.deepEqual(await live(options.root), before)
  await recoverRelease(options)
  assert.deepEqual(await live(options.root), before)
})

test('recovery rechecks a changed file immediately before restoring it', async t => {
  const options = await fixture(t)
  let promoted = 0
  let changed
  await assert.rejects(runRelease({ ...options, stage: stageAll, checkpoint: async phase => {
    if (phase === 'promotion' && ++promoted === 6) throw new Error('E_PROMOTION_FIXTURE')
    if (phase === 'recovery' && !changed) {
      const journal = JSON.parse(await readFile(join(options.root, transaction, 'journal.json'), 'utf8'))
      changed = journal.files[0].path
      await put(options.root, changed, 'editor changed during recovery')
    }
  } }), /E_RELEASE_RECOVERY_REQUIRED/)
  assert.equal(await readFile(join(options.root, changed), 'utf8'), 'editor changed during recovery')
  await assert.rejects(recoverRelease(options), /E_RELEASE_CONFLICT/)
})

test('recovery conflict leaves all live files and journal untouched for resolution', async t => {
  const options = await fixture(t)
  await assert.rejects(runRelease({ ...options, stage: stageAll, checkpoint: async (phase, path) => {
    if (phase === 'promotion') {
      await put(options.root, path, 'concurrent user edit')
      throw new Error('E_PROMOTION_FIXTURE')
    }
  } }), /E_RELEASE_RECOVERY_REQUIRED/)
  const before = await live(options.root)
  const journal = await readFile(join(options.root, transaction, 'journal.json'), 'utf8')
  for (const operation of [recoverRelease, runRelease]) {
    await assert.rejects(operation({ ...options, gate: () => assert.fail('conflicting recovery must precede publication authorization'),
      stage: () => assert.fail('conflicting recovery must not stage'),
    }), /E_RELEASE_CONFLICT/)
  }
  assert.deepEqual(await live(options.root), before)
  assert.equal(await readFile(join(options.root, transaction, 'journal.json'), 'utf8'), journal)
  const conflicted = JSON.parse(journal).files.find(row => before[row.path] === 'concurrent user edit')
  // Explicit fixture resolution restores the journal's old version.
  await put(options.root, conflicted.path, await readFile(join(options.root, transaction, 'old', conflicted.path)))
  await recoverRelease(options)
})

test('committed cleanup never rolls a successful generation back', async t => {
  const options = await fixture(t)
  await assert.rejects(runRelease({ ...options, stage: stageAll, checkpoint: async phase => {
    if (phase === 'committed') throw new Error('E_COMMITTED_FIXTURE')
  } }), /E_COMMITTED_FIXTURE/)
  for (const path of generated) assert.equal(await readFile(join(options.root, path), 'utf8'), 'new:' + path)
  await recoverRelease(options)
})

test('kernel lock spans generation and consuming compiler commands', async t => {
  const options = await fixture(t)
  await runRelease({ ...options, stage: async context => {
    await assert.rejects(withReleaseLock(options.root, () => assert.fail('second writer acquired lock')), /E_RELEASE_LOCKED/)
    await stageAll(context)
  }, consume: async run => {
    await assert.rejects(withReleaseLock(options.root, () => assert.fail('reader released lock')), /E_RELEASE_LOCKED/)
    const code = `import { withReleaseLock } from ${JSON.stringify(new URL('./generate-release.mjs', import.meta.url).href)};
      await withReleaseLock(${JSON.stringify(options.root)}, () => {}).then(() => process.exit(2), error => {
        if (!error.message.includes('E_RELEASE_LOCKED')) throw error;
      });`
    await run([process.execPath, '--input-type=module', '-e', code])
  } })
  await withReleaseLock(options.root, async () => {})
})

test('stage worker context records actual output writes and downstream crest reads', async t => {
  const options = await fixture(t)
  await runRelease({ ...options, stage: async ({ run }) => {
    const setup = `import { generatorStage } from ${JSON.stringify(new URL('./generate-release.mjs', import.meta.url).href)};
      import { readFile } from 'node:fs/promises';
      import { join } from 'node:path';
      const { root, writeFile } = await generatorStage(${JSON.stringify(options.root)});`
    await run([process.execPath, '--input-type=module', '-e', setup + `await writeFile(join(root, ${JSON.stringify(generated[0])}), 'worker crest');`])
    await run([process.execPath, '--input-type=module', '-e', setup + `await writeFile(join(root, 'src/generated/worker.json'), await readFile(join(root, ${JSON.stringify(generated[0])})));`])
  } })
  assert.equal(await readFile(join(options.root, generated[0]), 'utf8'), 'worker crest')
  assert.equal(await readFile(join(options.root, 'src/generated/worker.json'), 'utf8'), 'worker crest')
  const manifest = JSON.parse(await readFile(join(options.root, 'src/generated-private/generation-release-manifest.json'), 'utf8'))
  assert.deepEqual(manifest.files.map(row => row.path), [generated[0], 'src/generated/worker.json'])
})

test('symlink output parents are rejected before any stage output', async t => {
  const options = await fixture(t)
  await symlink(join(options.root, 'src/content'), join(options.root, 'public/linked'))
  await assert.rejects(runRelease({ ...options, stage: () => assert.fail('stage ran') }), /E_RELEASE_FILE/)
  assert.equal(await readFile(join(options.root, 'src/content/handwritten.md'), 'utf8'), 'user:src/content/handwritten.md')
})

test('evidence crosses a ledger directory symlink that resolves on the same device', async t => {
  const options = await fixture(t)
  const ledger = await mkdtemp(join(tmpdir(), 'generation-ledger-'))
  t.after(() => rm(ledger, { recursive: true, force: true }))
  // A worktree shares one ledger: its .omo/evidence is a link to the canonical directory.
  await mkdir(join(ledger, 'evidence/station-line-facts'), { recursive: true })
  await rename(join(options.root, evidence), join(ledger, 'evidence/station-line-facts/adjacency-coverage.json'))
  await rm(join(options.root, '.omo/evidence'), { recursive: true })
  await symlink(join(ledger, 'evidence'), join(options.root, '.omo/evidence'))
  await runRelease({ ...options, stage: stageAll })
  assert.equal(await readFile(join(ledger, 'evidence/station-line-facts/adjacency-coverage.json'), 'utf8'), 'new:' + evidence)
  assert.equal(await readFile(join(options.root, evidence), 'utf8'), 'new:' + evidence)
  const manifest = JSON.parse(await readFile(join(options.root, 'src/generated-private/generation-release-manifest.json'), 'utf8'))
  assert.ok(manifest.files.some(row => row.path === evidence))
  await assert.rejects(readdir(join(options.root, transaction)), { code: 'ENOENT' })
})

test('a symlinked evidence file and a ledger link into a published root are rejected', async t => {
  const options = await fixture(t)
  await rm(join(options.root, evidence))
  await symlink(join(options.root, 'src/content/handwritten.md'), join(options.root, evidence))
  await assert.rejects(runRelease({ ...options, stage: () => assert.fail('stage ran') }), /E_RELEASE_FILE/)
  await rm(join(options.root, '.omo/evidence'), { recursive: true })
  await mkdir(join(options.root, 'public/ledger/station-line-facts'), { recursive: true })
  await writeFile(join(options.root, 'public/ledger/station-line-facts/adjacency-coverage.json'), 'aliased')
  await symlink(join(options.root, 'public/ledger'), join(options.root, '.omo/evidence'))
  await assert.rejects(runRelease({ ...options, stage: () => assert.fail('stage ran') }), /E_RELEASE_FILE/)
  assert.equal(await readFile(join(options.root, 'public/ledger/station-line-facts/adjacency-coverage.json'), 'utf8'), 'aliased')
})

test('actual publication gate authenticates current review without live output mutation', async () => {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  // Invoke only the existing publication gate, never a real generate/build.
  const { requireGenerationPublication } = await import('./generate-release.mjs')
  const { isAuthenticatedPublicationReview } = await import('./seoul-census.mjs')
  const outputs = ['public', 'src/generated', 'src/generated-private']
  const before = await live(root, outputs)
  const review = await requireGenerationPublication(root)
  assert.equal(isAuthenticatedPublicationReview(review), true)
  assert.equal(review.complete, true)
  assert.equal(review.semanticReview, 'reviewed')
  assert.deepEqual(await live(root, outputs), before)
})

for (const state of ['prepared', 'promoting']) for (const operation of [recoverRelease, runRelease]) {
test(`${operation.name} restores ${state} journal after approval revocation without publishing`, async t => {
  const options = await fixture(t)
  await runRelease({ ...options, stage: stageAll })
  const before = await live(options.root)
  const code = `import { runRelease } from ${JSON.stringify(new URL('./generate-release.mjs', import.meta.url).href)};
    import { createHash } from 'node:crypto';
    await runRelease({ root: ${JSON.stringify(options.root)}, gate: async () => {},
      ownership: async (_, path) => createHash('sha256').update('old:' + path).digest('hex'),
      stage: async ({ write }) => { await write(${JSON.stringify(generated[0])}, 'interrupted'); },
      checkpoint: async (phase, path) => {
        if (${JSON.stringify(state)} === 'prepared' ? phase === 'prepared'
          : phase === 'promotion' && path === 'src/generated-private/generation-release-manifest.json') process.kill(process.pid, 'SIGKILL');
      },
    });`
  const child = spawn(process.execPath, ['--input-type=module', '-e', code], { stdio: ['ignore', 'pipe', 'pipe'] })
  let stderr = ''
  child.stderr.on('data', bytes => { stderr += bytes })
  // close (not exit) waits for inherited broker pipes to close as well: no
  // timing sleeps or lock-acquisition retries are needed after the kill.
  const result = await new Promise((resolveChild, reject) => {
    child.once('error', reject)
    child.once('close', (code, signal) => resolveChild({ code, signal }))
  })
  assert.equal(result.signal, 'SIGKILL', stderr)
  assert.equal(JSON.parse(await readFile(join(options.root, transaction, 'journal.json'), 'utf8')).state, state)
  if (state === 'promoting') assert.notDeepEqual(await live(options.root), before)
  let gateCalls = 0
  const revoked = { ...options, gate: async () => {
    gateCalls += 1
    // Restore the previous release manifest and all old bytes before a new
    // publication is considered, keeping the same lock through authorization.
    assert.deepEqual(await live(options.root), before)
    await assert.rejects(withReleaseLock(options.root, () => assert.fail('lock released before authorization')), /E_RELEASE_LOCKED/)
    throw new Error('E_SCOPE_PENDING')
  }, stage: () => assert.fail('revoked release staged new output'), consume: () => assert.fail('revoked release ran consumers') }
  if (operation === runRelease) await assert.rejects(operation(revoked), /E_SCOPE_PENDING/)
  else await operation(revoked)
  assert.equal(gateCalls, operation === runRelease ? 1 : 0)
  assert.deepEqual(await live(options.root), before)
  await assert.rejects(readdir(join(options.root, transaction)), { code: 'ENOENT' })
  await recoverRelease(revoked)
  assert.deepEqual(await live(options.root), before)
})
}
