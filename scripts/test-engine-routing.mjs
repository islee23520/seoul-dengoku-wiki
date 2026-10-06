import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { matchesGlob } from 'node:path'
import { test } from 'vitest'
import config from '../vitest.config.mjs'

const nativeFiles = ['scripts/test-clan-crests.mjs', 'scripts/test-naming-ledger-gate.mjs']
const familyFile = 'scripts/test-family-catalog.mjs'
const scripts = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')).scripts
const included = (path, routing) => routing.include.some((pattern) => matchesGlob(path, pattern))
  && !routing.exclude.some((pattern) => matchesGlob(path, pattern))
const assertRouting = (routing) => {
  for (const path of nativeFiles) assert.equal(included(path, routing), false, path)
  assert.equal(included(familyFile, routing), true, familyFile)
}

test('Vitest excludes native modules and retains the family catalog', () => {
  assertRouting(config.test)
  assert.throws(() => assertRouting({ ...config.test, exclude: config.test.exclude.filter((path) => !nativeFiles.includes(path)) }))
  assert.throws(() => assertRouting({ ...config.test, exclude: [...config.test.exclude, familyFile] }))
})

test('standalone npm test generates and runs each engine once', () => {
  assert.deepEqual(scripts.test.split(' && '), [
    'npm run generate',
    'vitest run',
    `node --test ${nativeFiles.join(' ')}`,
  ])
  assert.equal(scripts['test:crests'], `node --test ${nativeFiles[0]}`)
  assert.equal(scripts['test:families'], `vitest run ${familyFile}`)
})
