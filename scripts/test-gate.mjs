import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

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

test('absent unit type is valid while present unit copy remains checked', () => {
  for (const type of [undefined, null, '']) {
    const fields = personVisibleFields({ name: '정상', unit: { type, quality: '정예', note: '사용자 확정', composition: ['경비병'] } }, 'person')
    assert.ok(!fields.some(([path]) => path.endsWith('/unit/type')))
    assert.ok(fields.every(([, value]) => typeof value === 'string'))
    assert.ok(fields.flatMap(([path, value]) => visibleFieldFailures(value, path)).some((failure) => failure.includes('/unit/note')))
    assert.ok(fields.some(([path, value]) => path.endsWith('/unit/composition/0') && value === '경비병'))
  }
})

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

function assertMartialLedger(martial, naming) {
  assert.equal(martial.id, 'DOC:Martial-Paths')
  const tables = martial.content.filter(({ anchor }) => anchor === '아홉-유파-table1')
  assert.equal(tables.length, 1)
  const [table] = tables
  assert.equal(table.kind, 'table')
  assert.equal(table.columns.length, 6)
  assert.equal(table.rows.length, 38)
  const categories = new Set()
  const pairs = []
  const emptyAscended = []
  for (const row of table.rows) {
    assert.equal(row.length, 6)
    for (const cell of row) {
      assert.equal(typeof cell.ko, 'string')
      assert.equal(typeof cell.en, 'string')
      assert.ok(cell.ko.trim() && cell.en.trim())
    }
    for (const index of [2, 3, 4, 5]) assert.equal(row[index].en, row[index].ko)
    categories.add(row[0].ko)
    for (const [name, hanja, ascended] of [[row[2].ko, row[3].ko, false], [row[4].ko, row[5].ko, true]]) {
      if (name === '—' && hanja === '—' && ascended) {
        emptyAscended.push(row[2].ko)
      } else {
        assert.notEqual(name, '—')
        assert.notEqual(hanja, '—')
        pairs.push([name, hanja])
      }
    }
  }
  assert.equal(categories.size, 9)
  assert.deepEqual(emptyAscended, ['총검술'])
  assert.equal(pairs.length, 75)
  assert.equal(new Set(pairs.map(([name]) => name)).size, 75)
  assert.equal(naming.martialSchools.length, 75)
  assert.deepEqual(pairs, naming.martialSchools.map(({ formalName, hanja }) => [formalName, hanja]))
  assert.ok(naming.martialSchools.every(({ alias }) => alias === null))
  assert.equal(naming.martialBranch.name, '개방 무공')
  assert.equal(naming.martialBranch.rightsStatus, 'retired')
  assert.equal(naming.martialBranch.formalName, null)
  assert.match(naming.martialBranch.source, /^lore\/editorial\/[^#]+\.json#\//u)
  assert.ok(!categories.has(naming.martialBranch.name))
  assert.ok(!naming.martialSchools.some(({ formalName }) => formalName === naming.martialBranch.name))
}

test('nine martial categories and 75 ordered formal-name pairs match the private ledger', () => {
  assertMartialLedger(canon('lore/culture/Martial-Paths.json'), ledger)
})

test('martial table and ledger reject malformed identities while ignoring display prose', () => {
  const martial = canon('lore/culture/Martial-Paths.json')
  const table = martial.content.find(({ anchor }) => anchor === '아홉-유파-table1')
  const cases = [
    ['missing table', (source) => { source.content = source.content.filter(({ anchor }) => anchor !== table.anchor) }],
    ['duplicate table', (source) => { source.content.push(structuredClone(table)) }],
    ['missing row', (source) => { source.content.find(({ anchor }) => anchor === table.anchor).rows.pop() }],
    ['malformed row', (source) => { source.content.find(({ anchor }) => anchor === table.anchor).rows[0].pop() }],
    ['duplicate name', (source) => { source.content.find(({ anchor }) => anchor === table.anchor).rows[1][2].ko = table.rows[0][2].ko }],
    ['changed name', (source) => { source.content.find(({ anchor }) => anchor === table.anchor).rows[0][2].ko = '다른 이름' }],
    ['wrong Hanja', (source) => { source.content.find(({ anchor }) => anchor === table.anchor).rows[0][3].ko = '異字' }],
    ['English pair drift', (source) => { source.content.find(({ anchor }) => anchor === table.anchor).rows[0][2].en = 'Different name' }],
    ['half-empty ascent', (source) => { source.content.find(({ anchor }) => anchor === table.anchor).rows[0][4].ko = '—' }],
    ['extra empty ascent', (source) => { const row = source.content.find(({ anchor }) => anchor === table.anchor).rows[0]; row[4].ko = '—'; row[5].ko = '—' }],
    ['blank pair', (source) => { source.content.find(({ anchor }) => anchor === table.anchor).rows[0][2].ko = '' }],
    ['non-null alias', (_source, naming) => { naming.martialSchools[0].alias = '별칭' }],
    ['branch in names', (_source, naming) => { naming.martialSchools[0].formalName = naming.martialBranch.name }],
    ['retired branch promoted', (_source, naming) => { naming.martialBranch.rightsStatus = 'original' }],
    ['retired branch points to public source', (_source, naming) => { naming.martialBranch.source = 'lore/culture/Martial-Paths.json#/content/35' }],
  ]
  for (const [label, mutate] of cases) {
    const source = structuredClone(martial)
    const naming = structuredClone(ledger)
    mutate(source, naming)
    assert.throws(() => assertMartialLedger(source, naming), undefined, label)
  }
  const reworded = structuredClone(martial)
  reworded.content.find(({ anchor }) => anchor === table.anchor).columns[0].ko = '표시 머리말'
  reworded.content.find(({ kind }) => kind === 'paragraph').text.ko = '표시 문단'
  assertMartialLedger(reworded, ledger)
})

test('sixteen canonical state names match the private ledger', () => {
  const table = canon('lore/factions/Sixteen-States.json').content.find((block) => block.kind === 'table' && block.columns[0].ko === 'ID')
  assert.ok(table)
  assert.equal(table.rows.length, 16)
  assert.deepEqual(table.rows.map((row) => [row[0].ko, row[1].ko]), ledger.states.map(({ id, name }) => [id, name]))
})

test('retired public forms fail on published text surfaces', () => {
  for (const source of ['src/generated/world/fixture.json', 'public/person-details/person-0001.json', 'dist/assets/index.js']) {
    assert.ok(retiredFormFailures('Seoul Sengoku', source).some((failure) => failure.includes(source)))
  }
  assert.ok(retiredFormFailures('Seoul Sengoku', 'src/generated/world/Current-State.json').length > 0)
})

test('retired precursor fails in state pages and chronicles', () => {
  for (const source of ['src/generated/world/Century-Annals.json', 'src/generated/world/Sixteen-States.json']) {
    assert.ok(retiredFormFailures('2090년 Seoul Sengoku 기록', source).length > 0)
  }
  assert.ok(retiredFormFailures('Seoul Sengoku', 'dist/assets/fixture.js').length > 0)
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
  assert.throws(() => pageFailures(doc, 'world/x', new Set()), /E_READER_AST:world\/x:.*unknownNode/u)
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
  const person = { name: '정상', unit: { type: '수행원', note: '사용자 확정' }, provenance: { approval: '창작 제안' } }
  assert.match(apiVisibleFields(person, 'gurps#/people/0').flatMap(([path, text]) => visibleFieldFailures(text, path))[0], /unit\/note/u)
  assert.ok(!apiVisibleFields(person, 'gurps#/people/0').some(([path]) => path.includes('provenance')))
  assert.ok(apiDeclaredFields(person, 'api/characters/person-0001').some(([path]) => path.includes('/unit/note')))
  assert.ok(!apiDeclaredFields(person, 'api/characters/person-0001').some(([path]) => path.includes('/provenance/approval')))
  const masked = { skills: [{ name: '사용자 확정', ko: '검법' }] }
  assert.deepEqual(apiVisibleFields(masked, 'api/characters/person-0001'), [['api/characters/person-0001#/skills/0/ko', '검법']])
})

test('generated person sheet and holdings copy participates in the public field gate', () => {
  const person = {
    name: '정상', gurps: { band: '일반 인물', traits: [{ name: '명성', kind: 'advantage' }], skills: [{ name: 'Observation', ko: '관찰' }] },
    unit: { type: '수행원', quality: '일반', note: '동행한다.', composition: ['수행원'] },
    territory: { fief_name: '거점', type: '초소', station: '역', state: 'S01', note: '거점이다.', settlement: { name: '마을', type: '정착지', description: '거점 곁에 있다.' } },
    wandering_force: { type: '유랑', current_location: '강변', note: '이동한다.', camp: { name: '야영지', type: '야영지', description: '강변에 있다.', facilities: ['숙소'], pack_up_time: '반나절' } },
  }
  const fields = personVisibleFields(person, 'person')
  for (const pointer of ['/gurps/band', '/gurps/traits/0/name', '/gurps/skills/0/ko', '/unit/note', '/unit/composition/0', '/territory/settlement/description', '/wandering_force/camp/facilities/0', '/wandering_force/camp/pack_up_time']) {
    assert.ok(fields.some(([path]) => path === `person#${pointer}`), pointer)
    const changed = structuredClone(person)
    const keys = pointer.slice(1).split('/')
    const leaf = keys.pop()
    keys.reduce((value, key) => value[key], changed)[leaf] = '사용자 확정'
    assert.ok(personVisibleFields(changed, 'person').flatMap(([path, value]) => visibleFieldFailures(value, path)).some((failure) => failure.includes(pointer)), pointer)
  }
  assert.ok(fields.every(([path, value]) => visibleFieldFailures(value, path).length === 0))
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
  assert.deepEqual(['label', 'summary'].flatMap((key) => visibleFieldFailures(category[key], key)), [])
  assert.deepEqual(visibleFieldFailures('문서 보관조는 원본을 열람하고 복제를 구분한다.', 'public/opening-territories.json#/regions/0/summary'), [])
  assert.match(visibleFieldFailures('인물 복제', 'public/opening-territories.json#/regions/0/summary')[0], /banned-term/u)
})

test('tooltip registry follows actual render consumption in both directions', () => {
  const declared = "const attrExplain = { ST: { icon: 'x', desc: '사용자 확정' } }; const skillExplain = { '권법': '창작 제안' }; const valueMeta = { '권위': { plus: '정상', minus: '정상' } }; const desireMeta = { '갈망': { plus: '정상', minus: '정상' } }"
  // 선언만 있고 렌더 참조가 없으면 공개 표면이 아니다: 요구하지 않고 수집하지도 않는다.
  assert.deepEqual(uiTooltipFields(declared), [])
  assert.deepEqual(uiTooltipFields('const unrelated = {}'), [])
  // 무관 객체의 속성 키와 멤버 이름은 값 참조가 아니다.
  assert.deepEqual(uiTooltipFields("const privateDiagnostics = { skillExplain: 'private-only' }; const meta = {}; meta.skillExplain"), [])
  // 실제로 소비되는 맵은 그대로 검사한다(표지 문구 플래그 포함).
  const consumed = declared + "; attrExplain['ST']; skillExplain['권법']; valueMeta['권위']; desireMeta['갈망']"
  const fields = uiTooltipFields(consumed)
  assert.equal(fields.length, 6)
  assert.deepEqual(fields.map(([path, text]) => visibleFieldFailures(text, path).length), [1, 1, 0, 0, 0, 0])
  // 소비되는데 선언이 없으면 실패한다. 제거된 미사용 맵은 요구하지 않는다.
  assert.throws(() => uiTooltipFields("const attrExplain = { ST: { icon: 'x', desc: '정상' } }; attrExplain['ST']; skillExplain['권법']"), /E_UI_TOOLTIP_FIELDS:skillExplain/u)
  assert.throws(() => uiTooltipFields(consumed.replace("const desireMeta = { '갈망': { plus: '정상', minus: '정상' } }; ", '')), /E_UI_TOOLTIP_FIELDS:desireMeta/u)
  // 미해결 값 참조는 다른 스코프의 같은 철자 선언으로 면제되지 않는다.
  assert.throws(() => uiTooltipFields("const attrHints = { ST: { icon: 'x', desc: '정상' } }; attrExplain['ST']"), /E_UI_TOOLTIP_FIELDS:attrExplain/u)
  assert.throws(() => uiTooltipFields("function neverRendered() { const skillExplain = { x: 'normal' }; return 0 }; skillExplain['x']"), /E_UI_TOOLTIP_FIELDS:skillExplain/u)
  // 미사용 같은이름 지역 선언은 실제 소비 맵을 덮어쓰지 못한다: 표지는 여전히 잡힌다.
  const shadowed = consumed + "; function neverRendered() { const attrExplain = { ST: { icon: 'y', desc: '정상' } }; return 0 }"
  const shadowFields = uiTooltipFields(shadowed)
  assert.equal(shadowFields.length, 6)
  assert.equal(shadowFields.filter(([path, text]) => visibleFieldFailures(text, path).length > 0).length, 2)
  // 그림자 선언 자체는 소비되지 않아 요구 대상이 아니다(빈 객체여도 통과).
  assert.equal(uiTooltipFields(consumed + "; function neverRendered() { const skillExplain = {}; return 0 }").length, 6)
})

// Each case mutates only readFileSync bytes in a fresh process, then executes the real CLI.
// No generated, canon, or shared-worktree file is changed by these regressions.
function gateProbe(fixture) {
  const script = `
    import fs from 'node:fs';
    import { syncBuiltinESMExports } from 'node:module';
    import { pathToFileURL } from 'node:url';
    import ts from 'typescript';
    const root = process.cwd();
    const fixture = JSON.parse(process.env.GATE_FIXTURE);
    const target = root + '/' + fixture.file;
    const read = fs.readFileSync;
    fs.readFileSync = function(path, ...args) {
      if (String(path) !== target) return read.call(this, path, ...args);
      const original = read.call(this, path, ...args);
      if (fixture.tsRename) {
        const ast = ts.createSourceFile(fixture.file, original, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        let targetNode;
        function visitRename(node) {
          if (!targetNode && ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.getText(ast) === fixture.tsRename.from) targetNode = node.name;
          ts.forEachChild(node, visitRename);
        }
        visitRename(ast);
        if (!targetNode) throw new Error('E_TEST_FIXTURE_RENAME');
        const renamedSource = original.slice(0, targetNode.getStart(ast)) + fixture.tsRename.to + original.slice(targetNode.getEnd());
        return fixture.append ? renamedSource + fixture.append : renamedSource;
      }
      if (fixture.append && !fixture.tsProperty) return original + fixture.append;
      if (fixture.tsProperty) {
        const ast = ts.createSourceFile(fixture.file, original, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        let target;
        function visit(node) {
          if (fixture.tsProperty.map === 'categoryIndex' && ts.isPropertyAssignment(node) && node.name.getText(ast).replaceAll('"', '') === 'categories' && ts.isArrayLiteralExpression(node.initializer)) {
            const entry = node.initializer.elements[fixture.tsProperty.entry];
            target = entry.properties.find(p => ts.isPropertyAssignment(p) && p.name.getText(ast).replaceAll('"', '') === fixture.tsProperty.property)?.initializer;
          }
          if (fixture.tsProperty.map === 'valueMeta' && ts.isVariableDeclaration(node) && node.name.getText(ast) === 'valueMeta' && ts.isObjectLiteralExpression(node.initializer)) {
            const entry = node.initializer.properties[fixture.tsProperty.entry];
            target = entry.initializer.properties.find(p => ts.isPropertyAssignment(p) && p.name.getText(ast) === fixture.tsProperty.property)?.initializer;
          }
          ts.forEachChild(node, visit);
        }
        visit(ast);
        if (!target || !ts.isStringLiteralLike(target)) throw new Error('E_TEST_FIXTURE_PROPERTY');
        { const out = original.slice(0, target.getStart(ast)) + JSON.stringify(fixture.tsProperty.value) + original.slice(target.getEnd()); if (fixture.append) return out + fixture.append; return out; }
      }
      if (fixture.tsArrayField) {
        const ast = ts.createSourceFile(fixture.file, original, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
        const declaration = ast.statements.filter(ts.isVariableStatement).flatMap(s => [...s.declarationList.declarations]).find(d => d.name.getText(ast) === fixture.tsArrayField.name);
        let array = declaration?.initializer;
        if (array && ts.isAsExpression(array)) array = array.expression;
        if (!array || !ts.isArrayLiteralExpression(array)) throw new Error('E_TEST_FIXTURE_ARRAY');
        const entry = array.elements[fixture.tsArrayField.entry];
        const prop = entry.properties.find(p => ts.isPropertyAssignment(p) && p.name.getText(ast).replaceAll('"', '') === fixture.tsArrayField.field);
        if (!prop) throw new Error('E_TEST_FIXTURE_ARRAY_FIELD');
        return original.slice(0, prop.initializer.getStart(ast)) + JSON.stringify(fixture.tsArrayField.value) + original.slice(prop.initializer.getEnd());
      }
      const data = JSON.parse(original);
      let parent = data;
      for (const key of fixture.path.slice(0, -1)) parent = parent[key];
      if (fixture.remove) delete parent[fixture.path.at(-1)];
      else if (fixture.rename) { const value = parent[fixture.path.at(-1)]; delete parent[fixture.path.at(-1)]; parent[fixture.rename] = value; }
      else parent[fixture.path.at(-1)] = fixture.value;
      return JSON.stringify(data);
    };
    syncBuiltinESMExports();
    process.argv[1] = root + '/scripts/gate.mjs';
    await import(pathToFileURL(process.argv[1]));
  `
  const run = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: repoRoot, encoding: 'utf8', timeout: 60000, env: { ...process.env, GATE_FIXTURE: JSON.stringify(fixture) },
  })
  if (run.error) throw run.error
  return { status: run.status, output: `${run.stdout}\n${run.stderr}` }
}

test('production gate reports visible map, timeline, state, and person-label markers', () => {
  for (const [fixture, fragment] of [
    [{ file: 'public/opening-territories.json', path: ['regions', 0, 'summary'], value: '사용자 확정' }, '/regions/0/summary'],
    [{ file: 'public/opening-territories.json', path: ['states', 0, 'vassals'], value: '사용자 확정' }, '/states/0/vassals'],
    [{ file: 'public/timeline-overview.json', path: ['years', 0, 'summary'], value: '사용자 확정' }, '/years/0/summary'],
    [{ file: 'public/person-details/person-1003.json', path: ['fields', '생업'], rename: '사용자 확정' }, '/fields/사용자 확정'],
  ]) {
    const result = gateProbe(fixture)
    assert.equal(result.status, 1, `${fragment}: ${result.output}`)
    assert.ok(result.output.includes(fragment), result.output)
  }
})

test('production gate excludes unused tooltip and private person metadata but catches consumed double-quoted tooltip', () => {
  const privatePerson = gateProbe({ file: 'public/person-details/person-1003.json', path: ['locked'], value: '사용자 확정' })
  assert.equal(privatePerson.status, 0, privatePerson.output)
  const unused = gateProbe({ file: 'src/pages/PersonDetailPage.tsx', append: "\nconst privateMetadata = {'approval': '사용자 확정'}\n" })
  assert.equal(unused.status, 0, unused.output)
  const consumed = gateProbe({ file: 'src/pages/PersonDetailPage.tsx', tsProperty: { map: 'valueMeta', entry: 0, property: 'plus', value: '사용자 확정' } })
  assert.equal(consumed.status, 1, consumed.output)
  assert.match(consumed.output, /editorial-marker: src\/pages\/PersonDetailPage.tsx#\/tooltips\/valueMeta\/0\/plus/u)
  // 무관 객체의 skillExplain 속성 키는 소비가 아니다: 게이트는 통과해야 한다.
  const propertyKey = gateProbe({ file: 'src/pages/PersonDetailPage.tsx', append: "\nconst privateDiagnostics = { skillExplain: 'private-only' };\n" })
  assert.equal(propertyKey.status, 0, propertyKey.output)
  // 실제 소비 맵의 표지는 미사용 같은이름 지역 선언이 가리지 못한다: 여전히 실패해야 한다.
  const shadow = gateProbe({
    file: 'src/pages/PersonDetailPage.tsx',
    tsProperty: { map: 'valueMeta', entry: 0, property: 'plus', value: '사용자 확정' },
    append: '\nfunction neverRenderedProbe() {\n  const valueMeta = { "권위": { icon: "x", plus: "normal", minus: "normal" } };\n  return 0;\n}\n',
  })
  assert.equal(shadow.status, 1, shadow.output)
  assert.match(shadow.output, /editorial-marker: src\/pages\/PersonDetailPage.tsx#\/tooltips\/valueMeta\/0\/plus/u)
  // 선언 이름만 바뀐 실제 참조(미해결)는 무관 같은이름 미사용 선언이 있어도 실패한다.
  const renamed = gateProbe({ file: 'src/pages/PersonDetailPage.tsx', tsRename: { from: 'valueMeta', to: 'valueMetaUnused' } })
  assert.equal(renamed.status, 1, renamed.output)
  assert.match(renamed.output, /E_UI_TOOLTIP_FIELDS:valueMeta/u)
  const renamedShadow = gateProbe({
    file: 'src/pages/PersonDetailPage.tsx',
    tsRename: { from: 'valueMeta', to: 'valueMetaUnused' },
    append: '\nfunction neverRenderedProbe() {\n  const valueMeta = { "권위": { icon: "x", plus: "normal", minus: "normal" } };\n  return 0;\n}\n',
  })
  assert.equal(renamedShadow.status, 1, renamedShadow.output)
  assert.match(renamedShadow.output, /E_UI_TOOLTIP_FIELDS:valueMeta/u)
  const hiddenSkill = gateProbe({ file: 'lore/name-pools/gurps-cast.json', path: ['people', 0, 'skills', 0, 'name'], value: '사용자 확정' })
  assert.equal(hiddenSkill.status, 0, hiddenSkill.output)
})

test('production gate rejects missing person identity, unsupported AST, and stale category consumer', () => {
  for (const [fixture, fragment] of [
    [{ file: 'public/person-details/person-1003.json', path: ['name'], remove: true }, '/name'],
    [{ file: 'src/generated/peopleCatalog.ts', tsArrayField: { name: 'peopleCatalog', entry: 0, field: 'name', value: null } }, '/people/0'],
    [{ file: 'src/generated/world/Martial-Paths.json', path: ['blocks', 0, 'type'], value: 'linkReference' }, 'linkReference'],
    [{ file: 'src/generated/categoryIndex.ts', tsProperty: { map: 'categoryIndex', entry: 0, property: 'summary', value: '사용자 확정' } }, 'categoryIndex'],
  ]) {
    const result = gateProbe(fixture)
    assert.equal(result.status, 1, `${fragment}: ${result.output}`)
    assert.ok(result.output.includes(fragment) || (fragment === 'categoryIndex' && result.output.includes('E_CATEGORY_CONSUMER')), result.output)
  }
})

test('English explanatory cell is a review candidate while numeric and identity remain distinct', () => {
  const en = canon('lore/culture/Martial-Paths.json')
  const text = en.content.find((node) => node.kind === 'table' && node.rows.some((row) => row.some((cell) => typeof cell.en === 'string' && cell.en.includes('Taekwondo'))))
  assert.ok(text)
  const cell = text.rows.flat().find((item) => typeof item.en === 'string' && item.en.includes('Taekwondo')).en
  const rows = tableReviewRows({ blocks: [{ type: 'table', children: [{ type: 'tableRow', children: [{ type: 'tableCell', children: [{ type: 'text', value: 'ID' }] }, { type: 'tableCell', children: [{ type: 'text', value: '1' }] }, { type: 'tableCell', children: [{ type: 'text', value: cell }] }] }] }] }, 'world-en/Martial-Paths.json')
  assert.deepEqual(rows.map((row) => row.kind), ['identity-or-numeric', 'identity-or-numeric', 'prose-candidate'])
})

test('article acceptance matches rendered inline text, literal brackets and image alt', () => {
  const doc = { title: '역사', reviewText: '본문', blocks: [{ type: 'paragraph', children: [
    { type: 'text', value: '사용자 ' }, { type: 'strong', children: [{ type: 'text', value: '확정' }] },
  ] }] }
  assert.match(pageFailures(doc, 'world/fixture.json', new Set()).join('\n'), /editorial-marker/u)
  doc.blocks[0].children = [{ type: 'text', value: '<사용자 확정>' }]
  assert.match(pageFailures(doc, 'world/fixture.json', new Set()).join('\n'), /editorial-marker/u)
  doc.blocks[0].children = [{ type: 'image', url: '/image.png', alt: '사용자 확정' }]
  assert.match(pageFailures(doc, 'world/fixture.json', new Set()).join('\n'), /editorial-marker/u)
})

test('production gate catches split and literal-angle visible article markers', () => {
  const path = ['blocks', 0, 'children']
  for (const value of [
    [{ type: 'text', value: '사용자 ' }, { type: 'strong', children: [{ type: 'text', value: '확정' }] }],
    [{ type: 'text', value: '<사용자 확정>' }],
    [{ type: 'image', url: '/missing.png', alt: '사용자 확정' }],
  ]) {
    const result = gateProbe({ file: 'src/generated/world/Martial-Paths.json', path, value })
    assert.equal(result.status, 1, result.output)
    assert.match(result.output, /editorial-marker.*Martial-Paths.json/u)
  }
})

test('production station gate checks shown polity names but ignores raw status codes', () => {
  const visible = gateProbe({ file: 'public/opening-territories.json', path: ['stations', 0, 'control', 'polityNames'], value: ['사용자 확정'] })
  assert.equal(visible.status, 1, visible.output)
  assert.match(visible.output, /stations\/0\/control\/polityNames/u)
  const status = gateProbe({ file: 'public/opening-territories.json', path: ['stations', 0, 'control', 'status'], value: '사용자 확정' })
  assert.equal(status.status, 0, status.output)
})

test('production region copy exception checks each occurrence independently', () => {
  const file = 'public/opening-territories.json'
  const path = ['regions', 0, 'summary']
  const allowed = gateProbe({ file, path, value: '문서를 복제했다.' })
  assert.equal(allowed.status, 0, allowed.output)
  const mixed = gateProbe({ file, path, value: '문서를 복제했다. 인물 복제도 했다.' })
  assert.equal(mixed.status, 1, mixed.output)
  assert.match(mixed.output, /regions\/0\/summary.*복제/u)
})

test('article acceptance rejects missing title and malformed renderer containers', () => {
  const doc = { reviewText: '본문', blocks: [{ type: 'paragraph' }] }
  assert.throws(() => pageFailures(doc, 'world/fixture.json', new Set()), /title|AST/u)
  doc.title = '정상'
  assert.throws(() => pageFailures(doc, 'world/fixture.json', new Set()), /E_READER_AST/u)
  doc.blocks = [{ type: 'linkReference', children: [{ type: 'text', value: '정상' }] }]
  assert.throws(() => pageFailures(doc, 'world/fixture.json', new Set()), /linkReference/u)
})

test('generated declaration parser rejects backup names and unrelated arrays', () => {
  assert.throws(() => generatedArray('export const stateCatalogBackup = [{"name":"정상"}]', 'stateCatalog', 'fixture'), /E_GENERATED_ARRAY/u)
  assert.throws(() => generatedArray('export const stateCatalog = null; export const wrongCatalog = [{"name":"정상"}]', 'stateCatalog', 'fixture'), /E_GENERATED_ARRAY/u)
})
