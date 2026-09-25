import { mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { EXPECTED_REFERENCE_EXCLUSIONS, coinedPhraseFailures, referenceExclusionFailures } from './gate.mjs'

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

test('reviewed coined phrases fail on each published text surface', () => {
  for (const [source, text] of [
    ['src/generated/world/Oral-Stories.json', '창세 구술의 첫 줄'],
    ['public/person-details/person-0001.json', '창세의 첫 급수협약은 구술로만 안다'],
    ['dist/assets/index.js', '창세 이야기'],
  ]) {
    assert.ok(coinedPhraseFailures(text, source).some((failure) => failure.includes(source)))
  }
})

test('literal logbook lines and ordinary oral testimony are not coined phrases', () => {
  assert.deepEqual(coinedPhraseFailures('운전일지 제42권 첫 줄에 사망일을 적었다. 증언은 구술로 전한다. 창세기전은 참고작이다. 창세', 'world/Century-Annals'), [])
})
