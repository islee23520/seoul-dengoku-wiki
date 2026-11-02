import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { afterAll, beforeAll, test } from 'vitest'
import { hubInputs } from './hub-inputs.mjs'
import { verifyPublicFeedbackBoundary } from './verify-public-feedback-boundary.mjs'
import { packagePrivateFeedback } from './package-private-feedback.mjs'
import { loadSelectableViews } from '../../feedback-service/src/views.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const run = promisify(execFile)
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
// These real revisions share production/catalog sources; 34dd only updates
// the atlas test relative to its first parent 0bfa. Keep a distinct producer
// for both the existing 85143 public pin and the incoming 34dd public pin.
const producerRevisions = ['34dd7f8c153921517e015061da97fc56b2c2b9f1', '0bfa0f3cfcbe08ef019ee6de7eb3c70fd28d15a3']
let fixtureRoot, producerRoot, publicCommit, producerCommit

beforeAll(async () => {
  fixtureRoot = await mkdtemp(join(tmpdir(), 'hub-private-inputs-'))
  producerRoot = join(fixtureRoot, 'producer')
  publicCommit = (await run('git', ['-C', root, 'rev-parse', 'HEAD:WIKI'])).stdout.trim()
  assert.equal((await run('git', ['-C', join(root, 'WIKI'), 'rev-parse', 'HEAD'])).stdout.trim(), publicCommit)
  producerCommit = producerRevisions.find((revision) => revision !== publicCommit)
  assert.notEqual(producerCommit, publicCommit)
  await run('git', ['-C', join(root, 'WIKI'), 'merge-base', '--is-ancestor', producerRevisions[1], producerRevisions[0]])
  await run('git', ['-C', join(root, 'WIKI'), 'cat-file', '-e', `${producerCommit}^{commit}`])
  await run('git', ['clone', '--no-hardlinks', '--no-checkout', join(root, 'WIKI'), producerRoot])
  await run('git', ['-C', producerRoot, 'checkout', '--detach', producerCommit])
  await run('npm', ['ci', '--ignore-scripts'], { cwd: producerRoot, maxBuffer: 16 * 1024 * 1024 })
  await run('npm', ['run', 'generate'], { cwd: producerRoot, env: { ...process.env, SEOUL_KENSHI_ROOT: root }, maxBuffer: 16 * 1024 * 1024 })
  assert.equal((await run('git', ['-C', producerRoot, 'status', '--porcelain'])).stdout, '')
})

afterAll(async () => {
  if (fixtureRoot) await rm(fixtureRoot, { recursive: true, force: true })
})

async function publicHashes() {
  const files = await readdir(join(root, 'WIKI/dist'), { recursive: true, withFileTypes: true })
  const hashes = await Promise.all(files.filter((file) => file.isFile()).map(async (file) => {
    const path = join(file.parentPath, file.name)
    return [path, sha256(await readFile(path))]
  }))
  return hashes.sort(([a], [b]) => a.localeCompare(b))
}

test('public mode uses only the parent WIKI and does not require a producer', async () => {
  assert.deepEqual(hubInputs(root, {}), { mode: '0' })
  assert.deepEqual(hubInputs(root, { PRIVATE_FEEDBACK_ENABLED: '0' }), { mode: '0' })
  await verifyPublicFeedbackBoundary(join(root, 'WIKI/dist'))
})

test('private input must be explicit, complete, clean, and distinct from parent WIKI', async () => {
  assert.throws(() => hubInputs(root, { PRIVATE_FEEDBACK_ENABLED: '1' }), /FEEDBACK_WIKI_SOURCE_AND_COMMIT_REQUIRED/)
  assert.throws(() => hubInputs(root, { PRIVATE_FEEDBACK_ENABLED: '1', FEEDBACK_WIKI_SOURCE: producerRoot }), /FEEDBACK_WIKI_SOURCE_AND_COMMIT_REQUIRED/)
  assert.throws(() => hubInputs(root, { PRIVATE_FEEDBACK_ENABLED: '1', FEEDBACK_WIKI_COMMIT: producerCommit }), /FEEDBACK_WIKI_SOURCE_AND_COMMIT_REQUIRED/)
  assert.throws(() => hubInputs(root, { FEEDBACK_WIKI_SOURCE: producerRoot }), /FEEDBACK_WIKI_SOURCE_REQUIRES_PRIVATE_MODE/)
  assert.throws(() => hubInputs(root, { PRIVATE_FEEDBACK_ENABLED: '1', FEEDBACK_WIKI_SOURCE: join(root, 'WIKI'), FEEDBACK_WIKI_COMMIT: producerCommit }), /FEEDBACK_PRODUCER_MUST_BE_SEPARATE/)
  assert.throws(() => hubInputs(root, { PRIVATE_FEEDBACK_ENABLED: '1', FEEDBACK_WIKI_SOURCE: producerRoot, FEEDBACK_WIKI_COMMIT: 'a'.repeat(40) }), /FEEDBACK_WIKI_SOURCE_NOT_CLEAN_PINNED/)
  const path = join(producerRoot, 'package.json')
  const original = await readFile(path)
  try {
    await writeFile(path, Buffer.concat([original, Buffer.from('\n')]))
    assert.throws(() => hubInputs(root, { PRIVATE_FEEDBACK_ENABLED: '1', FEEDBACK_WIKI_SOURCE: producerRoot, FEEDBACK_WIKI_COMMIT: producerCommit }), /FEEDBACK_WIKI_SOURCE_NOT_CLEAN_PINNED/)
  } finally { await writeFile(path, original) }
})

test('private catalog artifact binds producer while the public dist stays parent pinned', async () => {
  const selected = hubInputs(root, { PRIVATE_FEEDBACK_ENABLED: '1', FEEDBACK_WIKI_SOURCE: producerRoot, FEEDBACK_WIKI_COMMIT: producerCommit })
  assert.notEqual(selected.wikiCommit, selected.gitlink)
  assert.notEqual(selected.source, resolve(root, 'WIKI'))
  assert.equal(selected.wikiCommit, producerCommit)
  const publicBefore = await publicHashes()
  const output = await mkdtemp(join(tmpdir(), 'hub-private-separated-'))
  try {
    const result = await packagePrivateFeedback({ sourceRoot: root, catalogRoot: producerRoot, site: join(root, 'WIKI/dist'), output, parentCommit: selected.parentCommit, wikiGitlink: selected.gitlink, wikiCommit: selected.wikiCommit, producerCommit })
    assert.equal(result.manifest.provenance.wikiGitlink, selected.gitlink)
    assert.equal(result.manifest.provenance.wikiGitlink, publicCommit)
    assert.notEqual(result.manifest.provenance.producerCommit, result.manifest.provenance.wikiGitlink)
    assert.equal(result.manifest.provenance.wikiCommit, producerCommit)
    assert.equal(result.manifest.provenance.producerCommit, producerCommit)
    assert.equal(result.manifest.provenance.producerSha256, sha256(await readFile(join(producerRoot, 'scripts/feedback-source-catalog.mjs'))))
    for (const source of result.manifest.provenance.sources) {
      assert.equal(source.sha256, sha256(await readFile(join(producerRoot, source.path.slice('WIKI/'.length)))))
    }
    for (const artifact of result.manifest.artifacts) {
      const bytes = await readFile(join(output, 'private-feedback', artifact.path))
      assert.equal(artifact.sha256, sha256(bytes))
      assert.equal(artifact.bytes, bytes.length)
    }
    const catalogs = ['ko', 'en'].map((locale) => join(output, 'private-feedback/catalogs', `feedback-selectable-views.${locale}.json`))
    const loaded = loadSelectableViews(catalogs)
    for (const locale of ['ko', 'en']) assert.ok([...loaded.documents.values()].some((document) => document.locale === locale))
    assert.deepEqual(await publicHashes(), publicBefore)
    assert.equal(await readFile(join(output, 'seoul-dengoku-feedback-private.tar.sha256'), 'utf8'), `${sha256(await readFile(result.archive))}  seoul-dengoku-feedback-private.tar\n`)
  } finally { await rm(output, { recursive: true, force: true }) }
})
