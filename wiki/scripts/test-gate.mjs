import { mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { EXPECTED_REFERENCE_EXCLUSIONS, referenceExclusionFailures } from './gate.mjs'

const scriptDir = fileURLToPath(new URL('.', import.meta.url))
const referenceDir = [
  join(scriptDir, '..', '..', 'RESEARCH', 'canon-reference'),
  join(scriptDir, '..', '..', '..', 'RESEARCH', 'canon-reference'),
].find((path) => { try { return statSync(path).isDirectory() } catch { return false } })

function makeDisposableInventory(count) {
  const dir = mkdtempSync(join(tmpdir(), 'gate-ref-inv-'))
  for (let i = 1; i <= count; i += 1) writeFileSync(join(dir, `disposable-${String(i).padStart(2, '0')}.md`), 'x\n')
  return dir
}

function countReferenceMarkdown(dir) {
  return readdirSync(dir).filter((name) => name.endsWith('.md') && statSync(join(dir, name)).isFile()).length
}

test('real canon-reference inventory is exactly 20 markdown files', () => {
  assert.equal(countReferenceMarkdown(referenceDir), 20)
})

test('gate constant is locked to the real inventory count of 20', () => {
  assert.equal(EXPECTED_REFERENCE_EXCLUSIONS, countReferenceMarkdown(referenceDir))
})

test('real inventory passes the gate exclusion rule with zero failures', () => {
  assert.deepEqual(referenceExclusionFailures(referenceDir), [])
})

test('disposable 18-file inventory is rejected by the gate exclusion rule', () => {
  const dir = makeDisposableInventory(18)
  try {
    const failures = referenceExclusionFailures(dir)
    assert.equal(failures.length, 1)
    assert.match(failures[0], /expected 20 reference\/\*\.md files, found 18/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('disposable 21-file inventory is rejected by the gate exclusion rule', () => {
  const dir = makeDisposableInventory(21)
  try {
    const failures = referenceExclusionFailures(dir)
    assert.equal(failures.length, 1)
    assert.match(failures[0], /expected 20 reference\/\*\.md files, found 21/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('missing reference directory is reported as an exclusion failure', () => {
  const failures = referenceExclusionFailures(join(tmpdir(), 'gate-ref-missing-does-not-exist'))
  assert.equal(failures.length, 1)
  assert.match(failures[0], /RESEARCH\/canon-reference\/ is missing/)
})
