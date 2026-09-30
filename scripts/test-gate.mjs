import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import assert from 'node:assert/strict'

import { EXPECTED_REFERENCE_EXCLUSIONS, apiDeclaredFields, apiVisibleFields, coinedPhraseFailures, editorialMarkerFailures, findBannedTerms, generatedArray, htmlMetadata, pageFailures, personVisibleFields, privateLinkFailures, ravelenExclusionFailures, referenceExclusionFailures, retiredFormFailures, tableReviewRows, uiTooltipFields, visibleFieldFailures } from './gate.mjs'

const scriptDir = fileURLToPath(new URL('.', import.meta.url))
const repoRoot = join(scriptDir, '..')
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

test('editorial status markers cannot ship as visible wiki copy', () => {
  for (const marker of ['창작 제안', '(미확인)', '사용자 확정', 'owner-confirmed']) {
    assert.match(editorialMarkerFailures(marker, 'world/example')[0], /FAIL editorial-marker: world\/example/u)
  }
  assert.deepEqual(editorialMarkerFailures('역의 이름과 위치를 기록했다.', 'world/example'), [])
})

test('banned terms are checked in visible titles, person fields and HTML metadata without scanning library code or URLs', () => {
  assert.deepEqual(findBannedTerms('인물 복제'), ['복제'])
  assert.deepEqual(findBannedTerms('Seoul Subway States'), [])
  assert.deepEqual(htmlMetadata('<meta name="description" content="Seoul Sengoku"><script>clone()</script><a href="https://github.com/islee23520/seoul-kenshi">Wiki</a>'), 'Seoul Sengoku')
  assert.ok(retiredFormFailures(htmlMetadata('<meta property="og:title" content="Seoul Sengoku">'), 'dist/index.html metadata').length > 0)
})

test('eight canonical school names match the private ledger and carry no everyday alias', () => {
  const table = canon('lore/culture/Martial-Paths.json').content.find((block) => block.kind === 'table' && block.columns[0].ko === '정식명')
  assert.ok(table)
  assert.equal(table.rows.length, 8)
  assert.deepEqual(table.rows.map((row) => row[0].ko), ledger.martialSchools.map(({ formalName }) => formalName))
  assert.deepEqual(ledger.martialSchools.filter(({ alias }) => alias !== null), [])
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

test('structured article checks title and AST, not unrendered summary or private metadata', () => {
  const doc = { title: '역사', summary: '창작 제안', sourceKind: '창작 제안', reviewText: '본문', blocks: [{ type: 'paragraph', children: [{ type: 'text', value: '본문' }] }] }
  assert.deepEqual(pageFailures(doc, 'src/generated/world/Example.json', new Set()), [])
  doc.title = '사용자 확정'
  assert.match(pageFailures(doc, 'src/generated/world/Example.json', new Set())[0], /editorial-marker.*Example.json/u)
  doc.title = '역사'; doc.blocks[0].children[0].value = '(미확인)'
  assert.match(pageFailures(doc, 'src/generated/world/Example.json', new Set())[0], /editorial-marker.*Example.json/u)
  doc.blocks[0].children[0].value = '밸브를 잠갔다. 이름이 알려지지 않았다.'
  assert.deepEqual(pageFailures(doc, 'src/generated/world/Example.json', new Set()), [])
})

test('structured visible fields report precise path and private links without broad word bans', () => {
  assert.deepEqual(visibleFieldFailures('잠긴 문', 'category/summary'), [])
  assert.match(visibleFieldFailures('창작 제안', 'category/summary')[0], /category\/summary/u)
  assert.deepEqual(privateLinkFailures('/world/Cast-Profile-Contract', 'article'), ['FAIL private-link: article -> /world/Cast-Profile-Contract'])
  assert.throws(() => visibleFieldFailures(undefined, 'category/summary'), /E_VISIBLE_FIELD:category\/summary/u)
  const doc = { title: '정상', reviewText: '본문', blocks: [{ type: 'paragraph', children: [{ type: 'text' }] }] }
  assert.throws(() => pageFailures(doc, 'world/x', new Set()), /E_READER_AST:world\/x:.*value/u)
  doc.blocks[0].children[0] = { type: 'unknownNode' }
  assert.throws(() => pageFailures(doc, 'world/x', new Set()), /E_READER_AST:world\/x:.*type/u)
})

test('person displayed fields are selected, and locked/source metadata is excluded', () => {
  const person = { name: '정상', title: '직함', sections: { 생애: '창작 제안', 기타: '창작 제안' }, fields: { 생업: '정상', 소속: '창작 제안' }, biography: '정상', locked: '창작 제안', sourceKind: '창작 제안', clan: { name: '정상' }, relations: { outgoing: [{ from: 'A', to: 'B', type: '관계', basis: '정상' }], incoming: [] } }
  const fields = personVisibleFields(person, 'public/person-details/p.json')
  assert.ok(fields.some(([path]) => path.endsWith('/sections/생애')))
  assert.ok(!fields.some(([path]) => path.includes('/locked') || path.includes('/sourceKind') || path.includes('/fields/소속') || path.includes('/sections/기타')))
  assert.match(fields.flatMap(([path, text]) => visibleFieldFailures(text, path))[0], /sections\/생애/u)
  assert.ok(personVisibleFields({ ...person, sections: { 생애: '정상' } }, 'person').every(([path, text]) => visibleFieldFailures(text, path).length === 0))
})

test('API source boundary follows declared UI copy, not private evidence', () => {
  const person = { name: '정상', unit: { note: '사용자 확정' }, provenance: { approval: '창작 제안' } }
  assert.match(apiVisibleFields(person, 'gurps#/people/0').flatMap(([path, text]) => visibleFieldFailures(text, path))[0], /unit\/note/u)
  assert.ok(!apiVisibleFields(person, 'gurps#/people/0').some(([path]) => path.includes('provenance')))
  assert.ok(apiDeclaredFields(person, 'api/characters/person-0001').some(([path]) => path.includes('/unit/note')))
  assert.ok(!apiDeclaredFields(person, 'api/characters/person-0001').some(([path]) => path.includes('/provenance/approval')))
})

test('table review emits AST cells with source hashes without scoring or dropping identities', () => {
  const document = { blocks: [{ type: 'table', children: [
    { type: 'tableRow', children: [{ type: 'tableCell', children: [{ type: 'text', value: 'ID' }] }, { type: 'tableCell', children: [{ type: 'text', value: '설명' }] }] },
    { type: 'tableRow', children: [{ type: 'tableCell', children: [{ type: 'text', value: 'S01' }] }, { type: 'tableCell', children: [{ type: 'text', value: '그 유파 전수가 반으로 접힌다.' }] }] },
  ] }] }
  const rows = tableReviewRows(document, 'world/Martial-Paths.json')
  assert.equal(rows.length, 4)
  assert.deepEqual(rows.map((row) => row.kind), ['identity-or-numeric', 'identity-or-numeric', 'identity-or-numeric', 'prose-candidate'])
  assert.match(rows[3].source, /blocks\/0\/rows\/1\/cells\/1/u)
  assert.match(rows[3].sourceHash, /^[a-f0-9]{64}$/u)
  assert.throws(() => tableReviewRows({ blocks: [{ type: 'table', children: [{ type: 'tableRow', children: [{ type: 'tableCell', children: [{ type: 'text' }] }] }] }] }, 'world/x'), /E_READER_AST/u)
})

test('generated UI catalog adapter reads only the declared array and fails stale or malformed input', () => {
  const fixture = 'export const stateCatalog: readonly StateRecord[] = [{"name":"사용자 확정"}]\nexport const elsewhere = ["정상"]\n'
  const states = generatedArray(fixture, 'stateCatalog', 'fixture/stateCatalog.ts')
  assert.match(visibleFieldFailures(states[0].name, 'fixture/stateCatalog.ts#/states/0/name')[0], /states\/0\/name/u)
  assert.throws(() => generatedArray(fixture, 'peopleCatalog', 'fixture'), /E_GENERATED_ARRAY/u)
  assert.throws(() => generatedArray('export const stateCatalog = [undefined]', 'stateCatalog', 'fixture'), /SyntaxError/u)
})

test('category-purpose fields have local exceptions without hiding visible markers', () => {
  const category = { label: '기술', summary: '기록 장부의 수량과 잠긴 문을 설명한다.', requiredKinds: ['창작 제안'] }
  for (const key of ['label', 'summary']) assert.deepEqual(visibleFieldFailures(category[key], `registry/categories/0/${key}`), [])
  assert.match(visibleFieldFailures('사용자 확정', 'registry/categories/0/summary')[0], /editorial-marker/u)
  assert.equal(category.requiredKinds.includes('창작 제안'), true) // not a rendered field
})

test('actual consumer tooltip copy is a separate visible surface', () => {
  const source = "const attrExplain = { ST: { icon: 'x', desc: '사용자 확정' } }; const skillExplain = { '권법': '창작 제안' }"
  const fields = uiTooltipFields(source)
  assert.equal(fields.length, 2)
  assert.deepEqual(fields.map(([path, text]) => visibleFieldFailures(text, path).length), [1, 1])
  assert.throws(() => uiTooltipFields('const unrelated = {}'), /E_UI_TOOLTIP_FIELDS/u)
})
