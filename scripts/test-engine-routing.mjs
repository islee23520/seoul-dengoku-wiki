import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { matchesGlob } from 'node:path'
import { test } from 'vitest'
import config from '../vitest.config.mjs'

const nativeFiles = [
  'scripts/test-character-profile.mjs',
  'scripts/test-clan-crests.mjs',
  'scripts/test-generate-release.mjs',
  'scripts/test-naming-ledger-gate.mjs',
  'scripts/test-seoul-public-assets.mjs',
  'scripts/test-soul-assignments.mjs',
]
const familyFile = 'scripts/test-family-catalog.mjs'
const parentNativeFiles = [...nativeFiles, 'scripts/test-wiki-api-seoul.mjs', 'scripts/test-wiki-document-api.mjs']
const vitestFiles = [
  familyFile,
  'scripts/test-state-formation-contract.mjs',
  'lore/name-pools/verify-person-id-registry.mjs',
  'scripts/test-map-coordinate-selection.mjs',
  'scripts/test-event133-application.mjs',
]
const scripts = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')).scripts
const included = (path, routing) => routing.include.some((pattern) => matchesGlob(path, pattern))
  && !routing.exclude.some((pattern) => matchesGlob(path, pattern))
const assertRouting = (routing) => {
  for (const path of nativeFiles) assert.equal(included(path, routing), false, path)
  for (const path of vitestFiles) assert.equal(included(path, routing), true, path)
}

test('Vitest excludes native modules and retains Vitest modules', () => {
  assertRouting(config.test)
  for (const file of nativeFiles) {
    assert.throws(() => assertRouting({ ...config.test, exclude: config.test.exclude.filter((path) => path !== file) }))
  }
  for (const file of vitestFiles) {
    assert.throws(() => assertRouting({ ...config.test, exclude: [...config.test.exclude, file] }))
  }
})

test('standalone npm test generates and runs each engine once', () => {
  assert.deepEqual(scripts.test.split(' && '), [
    'npm run generate',
    'vitest run scripts/test-standalone-snapshot.mjs',
    `node --test ${nativeFiles.join(' ')}`,
  ])
  assert.equal(scripts['test:crests'], 'node --test scripts/test-clan-crests.mjs')
  assert.equal(scripts['test:families'], `vitest run ${familyFile}`)
})

test('parent npm test generates and runs the full Vitest and native suites', () => {
  assert.deepEqual(scripts['test:parent'].split(' && '), [
    'npm run generate',
    'vitest run',
    `node --test ${parentNativeFiles.join(' ')}`,
  ])
  for (const file of parentNativeFiles) assert.equal(included(file, config.test), false, file)
})
