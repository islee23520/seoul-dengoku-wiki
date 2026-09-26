import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { EXPECTED_REFERENCE_EXCLUSIONS, coinedPhraseFailures, findBannedTerms, htmlMetadata, ravelenExclusionFailures, referenceExclusionFailures, retiredFormFailures } from './gate.mjs'

const scriptDir = fileURLToPath(new URL('.', import.meta.url))
const repoRoot = join(scriptDir, '..', '..')
const ledger = JSON.parse(readFileSync(join(repoRoot, 'lore/editorial/Naming-Ledger.json'), 'utf8'))
const canon = (path) => JSON.parse(readFileSync(join(repoRoot, path), 'utf8'))
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

test('banned terms are checked in visible titles, person fields and HTML metadata without scanning library code or URLs', () => {
  assert.deepEqual(findBannedTerms('인물 복제'), ['복제'])
  assert.deepEqual(findBannedTerms('Seoul Subway States'), [])
  assert.deepEqual(htmlMetadata('<meta name="description" content="Seoul Sengoku"><script>clone()</script><a href="https://github.com/islee23520/seoul-kenshi">Wiki</a>'), 'Seoul Sengoku')
  assert.ok(retiredFormFailures(htmlMetadata('<meta property="og:title" content="Seoul Sengoku">'), 'dist/index.html metadata').length > 0)
})

test('nine canonical school names and aliases match the private ledger', () => {
  const table = canon('lore/culture/Martial-Paths.json').content.find((block) => block.kind === 'table' && block.columns[0].ko === '정식명')
  assert.ok(table)
  assert.equal(table.rows.length, 9)
  assert.deepEqual(table.rows.map((row) => [row[0].ko, row[1].ko]), ledger.martialSchools.map(({ formalName, alias }) => [formalName, alias]))
  assert.equal(ledger.martialBranch.name, '개방 무공')
  assert.ok(!ledger.martialSchools.some(({ formalName }) => formalName === '개방 무공'))
})

test('sixteen canonical state names and historical precursors match the private ledger', () => {
  const table = canon('lore/factions/Sixteen-States.json').content.find((block) => block.kind === 'table' && block.columns[0].ko === 'ID')
  assert.ok(table)
  assert.equal(table.rows.length, 16)
  assert.deepEqual(table.rows.map((row) => [row[0].ko, row[1].ko]), ledger.states.map(({ id, name }) => [id, name]))
})

test('retired public forms fail on published text surfaces', () => {
  for (const source of ['src/generated/world/fixture.json', 'public/person-details/person-0001.json', 'dist/assets/index.js']) {
    assert.ok(retiredFormFailures('Seoul Sengoku', source).some((failure) => failure.includes(source)))
  }
  assert.ok(retiredFormFailures('급수계약정', 'src/generated/world/Current-State.json').length > 0)
})

test('historical precursor remains valid in the state origin and chronicle', () => {
  for (const source of ['src/generated/world/Century-Annals.json', 'src/generated/world/Sixteen-States.json']) {
    assert.deepEqual(retiredFormFailures('2090년 급수계약정 기록', source), [])
  }
  assert.ok(retiredFormFailures('급수계약정', 'dist/assets/fixture.js').length > 0)
})

test('injected Ravelen references fail the public catalog exclusion rule', () => {
  for (const reference of ['Ravelen', 'rAvElEn', '라벨렌', '라벨렌의 연대기']) {
    const fixture = JSON.stringify({ title: 'World', reviewText: `참고: ${reference}`, blocks: [] })
    assert.deepEqual(ravelenExclusionFailures(fixture, 'src/generated/world/fixture.json'), [
      'FAIL exclusion: src/generated/world/fixture.json contains a Ravelen reference',
    ])
  }
})

test('the exclusion rule keeps unrelated word fragments', () => {
  assert.deepEqual(ravelenExclusionFailures('TravelEncounters ravelenish', 'fixture'), [])
})
