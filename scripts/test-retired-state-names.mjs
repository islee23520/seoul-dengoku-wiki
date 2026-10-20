import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { test } from 'vitest'
import { checkRetiredStateNames, retiredStateOffsets } from './check-retired-state-names.mjs'

const repo = new URL('../', import.meta.url)
const snapshotPath = 'snapshots/build-inputs/creative-name-normalization.json'
const snapshotBytes = readFileSync(new URL(snapshotPath, repo))
const manifests = ['scripts/issued-preservation-baseline.json', 'snapshots/build-inputs/source-manifest.json']
function preservedFixture(directory) {
  const issued = JSON.parse(readFileSync(new URL(manifests[0], repo), 'utf8'))
  const snapshot = JSON.parse(readFileSync(new URL(manifests[1], repo), 'utf8'))
  const paths = [...manifests, ...Object.keys(issued.revisions).map(revision => `vendor/issued-history/${revision}.json`),
    ...Object.keys(issued.sourceHashes).map(path => `vendor/issued-history/corpus/${path}`),
    ...snapshot.files.map(row => `snapshots/build-inputs/${row.path}`)]
  for (const path of paths) {
    mkdirSync(dirname(join(directory, path)), { recursive: true })
    writeFileSync(join(directory, path), readFileSync(new URL(path, repo)))
  }
  return paths.length - manifests.length
}

test('exact authenticated history is reported separately and copied bytes remain current corpus', () => {
  const directory = mkdtempSync(join(tmpdir(), 'retired-state-history-'))
  try {
    execFileSync('git', ['init', '--quiet', directory])
    const preservedCount = preservedFixture(directory)
    const initial = checkRetiredStateNames(directory)
    assert.deepEqual(initial.failures, [])
    assert.equal(initial.preserved.count, preservedCount)
    assert.equal(initial.scanned, manifests.length)
    assert.equal(initial.preserved.files.reduce((count, row) => count + row.retiredMatches, 0), 898)
    assert.ok(initial.preserved.files.every(row => !row.path.startsWith('public/') && !row.path.startsWith('dist/')))

    const currentPaths = ['public/history-copy.json', 'dist/history-copy.json', 'vendor/unrelated.json',
      'vendor/issued-history/undeclared.json', 'snapshots/unrelated.json', 'current.json']
    writeFileSync(join(directory, '.gitignore'), 'public/\ndist/\n')
    for (const path of currentPaths) {
      mkdirSync(dirname(join(directory, path)), { recursive: true })
      writeFileSync(join(directory, path), snapshotBytes)
    }
    const copied = checkRetiredStateNames(directory)
    assert.equal(copied.preserved.count, preservedCount)
    assert.deepEqual(new Set(copied.failures.map(row => row.path)), new Set(currentPaths))
    assert.equal(copied.failures.length, currentPaths.length * retiredStateOffsets(snapshotBytes.toString('utf8')).length)
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test('preserved history rejects changed bytes, missing files, and self-rebaselined manifests', () => {
  const directory = mkdtempSync(join(tmpdir(), 'retired-state-seals-'))
  try {
    execFileSync('git', ['init', '--quiet', directory])
    preservedFixture(directory)
    for (const path of [snapshotPath, 'vendor/issued-history/corpus/WORLD_BUILDING_GUIDE.md']) {
      const bytes = readFileSync(join(directory, path))
      writeFileSync(join(directory, path), Buffer.concat([bytes, Buffer.from('\n')]))
      assert.throws(() => checkRetiredStateNames(directory), { message: 'E_RETIRED_HISTORY_HASH:' + path })
      writeFileSync(join(directory, path), bytes)
    }
    unlinkSync(join(directory, snapshotPath))
    assert.throws(() => checkRetiredStateNames(directory), { code: 'ENOENT' })
    writeFileSync(join(directory, snapshotPath), snapshotBytes)
    for (const path of manifests) {
      const bytes = readFileSync(join(directory, path))
      writeFileSync(join(directory, path), JSON.stringify({ files: [{ path: '../../current.json', sha256: '0'.repeat(64) }] }))
      assert.throws(() => checkRetiredStateNames(directory), { message: 'E_RETIRED_HISTORY_MANIFEST_HASH:' + path })
      writeFileSync(join(directory, path), bytes)
    }
  } finally { rmSync(directory, { recursive: true, force: true }) }
})

test('tracked authoring UI tests private rules and generated outputs contain only current state identities', () => {
  const result = checkRetiredStateNames()
  assert.ok(result.scanned > 1000)
  assert.deepEqual(result.failures, [])
})

test('only confirmed tracked deletions are skipped, not missing assets or other IO errors', () => {
  const directory = mkdtempSync(join(tmpdir(), 'retired-state-names-'))
  try {
    execFileSync('git', ['init', '--quiet', directory])
    writeFileSync(join(directory, 'current.json'), '{}')
    writeFileSync(join(directory, 'deleted.json'), '{}')
    execFileSync('git', ['add', '.'], { cwd: directory })
    unlinkSync(join(directory, 'deleted.json'))
    assert.deepEqual(checkRetiredStateNames(directory), { scanned: 1, failures: [], preserved: { count: 0, files: [] } })

    mkdirSync(join(directory, 'dist'))
    symlinkSync(join(directory, 'missing.json'), join(directory, 'dist', 'required.json'))
    assert.throws(() => checkRetiredStateNames(directory), { code: 'ENOENT' })
    unlinkSync(join(directory, 'dist', 'required.json'))

    unlinkSync(join(directory, 'current.json'))
    mkdirSync(join(directory, 'current.json'))
    assert.throws(() => checkRetiredStateNames(directory), { code: 'EISDIR' })
  } finally { rmSync(directory, { recursive: true, force: true }) }
})
