import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'
import { renderLoreMarkdown } from './lore-json-render.mjs'

test('all canonical people expose unique detail routes and structured data', async () => {
  const catalog = await readFile(new URL('../src/generated/peopleCatalog.ts', import.meta.url), 'utf8')
  const routes = [...catalog.matchAll(/"detailRoute": "([^"]+)"/g)].map((match) => match[1])
  const detailRoot = new URL('../public/person-details/', import.meta.url)
  const names = (await readdir(detailRoot)).filter((name) => name.endsWith('.json'))
  assert.equal(routes.length, 1010)
  assert.equal(new Set(routes).size, 1010)
  assert.ok(routes.every((route) => /^\/people\/person-\d{4}$/u.test(route)))
  assert.equal(names.length, 1010)
  for (const name of names) {
    const detail = JSON.parse(await readFile(new URL(name, detailRoot), 'utf8'))
    assert.ok(detail.biography.length > 0, name)
    assert.equal(Object.keys(detail.values).length, 10, name)
    assert.equal(Object.keys(detail.desire).length, 7, name)
    assert.ok(['여성', '남성'].includes(detail.gender), name)
    if (detail.name === '신준') {
      assert.equal(detail.minors, true, name)
      assert.equal(detail.title, '', name)
      assert.equal(detail.position, '', name)
      assert.equal(detail.desire.지향, null, name)
      assert.equal(detail.desire.결합, null, name)
    } else assert.ok(detail.position.length > 0, name)
    assert.ok(detail.rank.length > 0, name)
    assert.ok(detail.occupation.length > 0, name)
  }
})

test('S01 issued cards retain an explicit occupation and martial state in person details', async () => {
  const document = JSON.parse(await readFile(new URL('../../lore/characters/Cast-State-01.json', import.meta.url), 'utf8'))
  const registry = JSON.parse(await readFile(new URL('../../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const issued = new Set(registry.persons.map((person) => person.name))
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: block.text.ko.replace(/^인물 /u, ''), index }]
    : [])
  assert.equal(headings.length, 65)
  const details = new Map()
  const detailRoot = new URL('../public/person-details/', import.meta.url)
  for (const file of (await readdir(detailRoot)).filter((name) => name.endsWith('.json'))) {
    const detail = JSON.parse(await readFile(new URL(file, detailRoot), 'utf8'))
    details.set(detail.name, detail)
  }
  for (const [index, heading] of headings.entries()) {
    assert.ok(issued.has(heading.name), heading.name)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const occupation = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
      .map((item) => typeof item.ko === 'string' ? item.ko : item.ko.map((run) => run.text).join(''))
      .find((item) => item.startsWith('생업: '))?.slice(4)
    assert.ok(occupation && occupation !== '미등록', heading.name)
    const detail = details.get(heading.name)
    assert.ok(detail, heading.name)
    assert.equal(detail.occupation, occupation, heading.name)
    if (detail.sourceRoute.startsWith('/world/Cast-State-01#')) assert.equal(detail.fields['생업'], occupation, heading.name)
    assert.ok(/^(?:수문손|차륜망치|호위방패|없음\. 생업만\.)/u.test(detail.sections['무공'] ?? ''), heading.name)
  }
})

test('S02 issued cards retain distinct bilingual livelihoods and their martial state', async () => {
  const document = JSON.parse(await readFile(new URL('../../lore/characters/Cast-State-02.json', import.meta.url), 'utf8'))
  const registry = JSON.parse(await readFile(new URL('../../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const idByName = new Map(registry.persons.map((person) => [person.name, person.id]))
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: block.text.ko.replace(/^인물 /u, ''), index }]
    : [])
  assert.equal(headings.length, 66)
  assert.ok(headings.some(({ name }) => name === '이일섭'))
  for (const [index, heading] of headings.entries()) {
    const id = idByName.get(heading.name)
    assert.ok(id, heading.name)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const occupation = fields.find((item) => typeof item.ko === 'string' && item.ko.startsWith('생업: '))
    assert.ok(occupation, heading.name)
    assert.match(occupation.en, /^Livelihood: \S/u, heading.name)
    const livelihood = occupation.ko.slice(4)
    assert.notEqual(livelihood, '미등록', heading.name)
    const title = fields.find((item) => typeof item.ko === 'string' && item.ko.startsWith('직함: '))?.ko.slice(4)
    assert.notEqual(livelihood, title, heading.name)
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/person-${id.slice(1).padStart(4, '0')}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.name, heading.name)
    assert.equal(detail.occupation, livelihood, heading.name)
    assert.equal(detail.fields['생업'], livelihood, heading.name)
    assert.ok(/^(?:수문손|차륜망치|호위방패|기록칼|없음\. 생업만\.)/u.test(detail.sections['무공'] ?? ''), heading.name)
  }
})

test('all currently issued S03 cards retain bilingual livelihoods distinct from office and martial path', async () => {
  const document = JSON.parse(await readFile(new URL('../../lore/characters/Cast-State-03.json', import.meta.url), 'utf8'))
  const registry = JSON.parse(await readFile(new URL('../../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const idByName = new Map(registry.persons.map((person) => [person.name, person.id]))
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: block.text.ko.replace(/^인물 /u, ''), index }]
    : [])
  assert.ok(headings.length > 0)
  assert.equal(new Set(headings.map(({ name }) => name)).size, headings.length)
  for (const [index, heading] of headings.entries()) {
    const id = idByName.get(heading.name)
    assert.ok(id, heading.name)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const occupations = fields.filter((item) => typeof item.ko === 'string' && item.ko.startsWith('생업: '))
    assert.equal(occupations.length, 1, heading.name)
    const occupation = occupations[0]
    assert.match(occupation.en, /^Livelihood: \S/u, heading.name)
    const livelihood = occupation.ko.slice(4)
    assert.notEqual(livelihood, '미등록', heading.name)
    const title = fields.find((item) => typeof item.ko === 'string' && item.ko.startsWith('직함: '))?.ko.slice(4)
    assert.notEqual(livelihood, title, heading.name)
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/person-${id.slice(1).padStart(4, '0')}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.name, heading.name)
    assert.equal(detail.occupation, livelihood, heading.name)
    assert.equal(detail.fields['생업'], livelihood, heading.name)
    assert.ok(/^(?:기록칼|차륜망치|호위방패|없음\. 생업만\.)/u.test(detail.sections['무공'] ?? ''), heading.name)
  }
})

test('all 64 issued S04 K IDs retain sourced bilingual livelihoods and martial paths', async () => {
  const document = JSON.parse(await readFile(new URL('../../lore/characters/Cast-State-04.json', import.meta.url), 'utf8'))
  const markdown = await readFile(new URL('../../lore/characters/Cast-State-04.md', import.meta.url), 'utf8')
  assert.equal(markdown, renderLoreMarkdown(document, 'ko'))
  const registry = JSON.parse(await readFile(new URL('../../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const idByName = new Map(registry.persons.map(({ id, name }) => [name, id]))
  const values = JSON.parse(await readFile(new URL('../../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const detailIndexByName = new Map(values.map(({ name }, index) => [name, index + 1]))
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: block.text.ko.replace(/^인물 /u, ''), index }]
    : [])
  assert.equal(headings.length, 64)
  const ids = headings.map(({ name }) => idByName.get(name))
  assert.equal(new Set(ids).size, 64)
  assert.ok(ids.every((id) => /^K\d{3,4}$/u.test(id)))
  const martial = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('')
  for (const [index, heading] of headings.entries()) {
    const id = ids[index]
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const livelihoods = fields.filter((item) => typeof item.ko === 'string' && item.ko.startsWith('생업: '))
    assert.equal(livelihoods.length, 1, id)
    const occupation = livelihoods[0]
    assert.match(occupation.en, /^Livelihood: \S/u, id)
    const ko = occupation.ko.slice(4)
    assert.notEqual(ko, '미등록', id)
    const title = fields.find((item) => typeof item.ko === 'string' && item.ko.startsWith('직함: '))?.ko.slice(4)
    const rank = fields.find((item) => typeof item.ko === 'string' && item.ko.startsWith('품계: '))?.ko.slice(4)
    assert.notEqual(ko, title, id)
    assert.notEqual(ko, rank, id)
    const detailIndex = detailIndexByName.get(heading.name)
    assert.ok(detailIndex, id)
    const detailId = `person-${String(detailIndex).padStart(4, '0')}`
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${detailId}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.id, detailId, id)
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.occupation, ko, id)
    assert.equal(detail.fields['생업'], ko, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-04#'), id)
    const martialText = blocks.filter((block) => block.kind === 'paragraph').map((block) => martial(block.text.ko)).join('\n')
      + '\n' + fields.map((item) => martial(item.ko)).join('\n')
    assert.match(martialText, /무공\.\s*(?:차륜망치|기록칼|수문손|호위방패|없음\. 생업만\.)/u, id)
  }
})

test('all 65 issued S05 cards retain bilingual livelihoods and their original martial declarations', async () => {
  const document = JSON.parse(await readFile(new URL('../../lore/characters/Cast-State-05.json', import.meta.url), 'utf8'))
  const markdown = await readFile(new URL('../../lore/characters/Cast-State-05.md', import.meta.url), 'utf8')
  assert.equal(markdown, renderLoreMarkdown(document, 'ko'))
  const registry = JSON.parse(await readFile(new URL('../../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const idByName = new Map(registry.persons.map(({ id, name }) => [name, id]))
  const values = JSON.parse(await readFile(new URL('../../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const detailIndexByName = new Map(values.map(({ name }, index) => [name, index + 1]))
  const plain = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('')
  const expectedMartial = new Map(Object.entries({
    '동방사 방패': 'K115 K116 K119 K123 K128 K129 K460 K508 K556 K604 K652 K700 K748 K796 K844 K892 K940 K988',
    '없음. 생업만.': 'K117 K131 K118 K125 K134 K136 K138 K139 K140 K141 K142 K428 K476 K524 K572 K620 K668 K716 K764 K812 K860 K908 K956',
    '수문손': 'K121 K126 K127 K130 K133 K137 K444 K492 K540 K588 K636 K684 K732 K780 K828 K876 K924 K972 K143',
    '차륜망치': 'K132 K135 K120 K124',
    '기록칼': 'K122',
  }).flatMap(([path, ids]) => ids.split(' ').map((id) => [id, path])))
  assert.equal(expectedMartial.size, 65)
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: plain(block.text.ko).replace(/^인물 /u, ''), index }]
    : [])
  assert.equal(headings.length, 65)
  const seen = new Set()
  for (const [index, heading] of headings.entries()) {
    const id = idByName.get(heading.name)
    assert.ok(/^K\d{3,4}$/u.test(id ?? ''), heading.name)
    assert.ok(!seen.has(id), id)
    seen.add(id)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const livelihoods = fields.filter((item) => plain(item.ko).startsWith('생업: '))
    assert.equal(livelihoods.length, 1, id)
    assert.match(plain(livelihoods[0].en), /^Livelihood: \S/u, id)
    const occupation = plain(livelihoods[0].ko).slice(4)
    assert.notEqual(occupation, '미등록', id)
    assert.notEqual(occupation, fields.find((item) => plain(item.ko).startsWith('품계: '))?.ko.slice(4), id)
    assert.notEqual(occupation, fields.find((item) => plain(item.ko).startsWith('직함: '))?.ko.slice(4), id)
    const detailIndex = detailIndexByName.get(heading.name)
    assert.ok(detailIndex, id)
    const detailId = `person-${String(detailIndex).padStart(4, '0')}`
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${detailId}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.id, detailId, id)
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.occupation, occupation, id)
    assert.equal(detail.fields['생업'], occupation, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-05#'), id)
    const martialText = blocks.flatMap((block) => block.kind === 'paragraph' ? [plain(block.text.ko)]
      : block.kind === 'list' ? block.items.map((item) => plain(item.ko)) : []).join('\n')
    const martial = martialText.match(/무공\.\s*(동방사 방패|수문손|차륜망치|기록칼|없음\. 생업만\.)/u)?.[1]
    assert.equal(martial, expectedMartial.get(id), id)
    assert.ok(detail.sections['무공']?.startsWith(martial), id)
  }
  assert.equal(seen.size, 65)
})

test('all 61 issued S06 cards retain bilingual livelihoods and their original martial declarations', async () => {
  const document = JSON.parse(await readFile(new URL('../../lore/characters/Cast-State-06.json', import.meta.url), 'utf8'))
  const markdown = await readFile(new URL('../../lore/characters/Cast-State-06.md', import.meta.url), 'utf8')
  assert.equal(markdown, renderLoreMarkdown(document, 'ko'))
  const registry = JSON.parse(await readFile(new URL('../../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const values = JSON.parse(await readFile(new URL('../../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const expectedMartial = new Map(Object.entries({
    '기록칼': 'K144 K161 K145 K146 K147 K148 K151 K153 K154 K156 K159 K164 K166 K461 K509 K557 K605 K653 K701 K749 K797 K845 K893 K941 K989 K168',
    '없음. 생업만.': 'K157 K149 K152 K160 K162 K165 K167 K429 K445 K477 K493 K525 K541 K573 K589 K621 K637 K669 K685 K717 K733 K765 K781 K813 K829 K861 K877 K909 K925 K957 K973',
    '차륜망치': 'K158 K150',
    '수문손': 'K155 K163',
  }).flatMap(([path, ids]) => ids.split(' ').map((id) => [id, path])))
  assert.equal(expectedMartial.size, 61)
  const plain = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('')
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: plain(block.text.ko).replace(/^인물 /u, ''), index }] : [])
  assert.equal(headings.length, 61)
  const seen = new Set()
  for (const [index, heading] of headings.entries()) {
    const matches = registry.persons.filter((person) => person.name === heading.name)
    assert.equal(matches.length, 1, heading.name)
    const id = matches[0].id
    assert.ok(expectedMartial.has(id), id)
    assert.ok(!seen.has(id), id)
    seen.add(id)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const occupations = fields.filter((item) => plain(item.ko).startsWith('생업: '))
    assert.equal(occupations.length, 1, id)
    assert.match(plain(occupations[0].en), /^Livelihood: \S/u, id)
    const occupation = plain(occupations[0].ko).slice(4)
    assert.ok(occupation && occupation !== '미등록', id)
    const field = (prefix) => fields.find((item) => plain(item.ko).startsWith(prefix))
    assert.notEqual(occupation, plain(field('품계: ').ko).slice(4), id)
    assert.notEqual(occupation, plain(field('직함: ').ko).slice(4), id)
    const detailMatches = values.flatMap((person, valueIndex) => person.name === heading.name && person.state === 'S06'
      ? [valueIndex + 1] : [])
    assert.equal(detailMatches.length, 1, id)
    const detailId = `person-${String(detailMatches[0]).padStart(4, '0')}`
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${detailId}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.id, detailId, id)
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.state, 'S06', id)
    assert.equal(detail.occupation, occupation, id)
    assert.equal(detail.fields['생업'], occupation, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-06#'), id)
    const martialText = blocks.flatMap((block) => block.kind === 'paragraph' ? [plain(block.text.ko)]
      : block.kind === 'list' ? block.items.map((item) => plain(item.ko)) : []).join('\n')
    const martial = martialText.match(/무공\.\s*(기록칼|차륜망치|수문손|없음\. 생업만\.)/u)?.[1]
    assert.equal(martial, expectedMartial.get(id), id)
    assert.ok(detail.sections['무공']?.startsWith(martial), id)
  }
  assert.equal(seen.size, 61)
})

test('person detail page renders tables and the canonical prose sections', async () => {
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const page = await readFile(new URL('../src/pages/PersonDetailPage.tsx', import.meta.url), 'utf8')
  assert.match(app, /path="\/people\/:personId"/)
  assert.match(page, /기본 정보/)
  assert.match(page, /가치관/)
  assert.match(page, /욕망/)
  assert.match(page, /정본 상세/)
  for (const label of ['생애', '관직', '무공', '일화', '가문', '관계', '야망', '공포', '개입']) assert.match(page, new RegExp(label))
  assert.match(page, /정본에 별도 산문이 등록되지 않았습니다/)
})

test('K998 keeps his detail route after relocation to the First Branch Workshop', async () => {
  const detail = JSON.parse(await readFile(new URL('../public/person-details/person-0998.json', import.meta.url), 'utf8'))
  assert.equal(detail.name, '이일섭')
  assert.equal(detail.state, 'S02')
  assert.equal(detail.title, '제1분공방 이씨 가문 후계')
  assert.equal(detail.rank, '이사')
  assert.equal(detail.commonTier, 'T3')
  assert.equal(detail.occupation, '제1분공방 차량기지 밭 경작·곡물 재고 관리')
  assert.equal(detail.sourceRoute, '/world/Cast-State-02#인물-이일섭')
  assert.equal(detail.fields.기여자, '[islee23520](https://github.com/islee23520)')
  assert.deepEqual(detail.relations, { outgoing: [], incoming: [] })
  assert.doesNotMatch(detail.biography, /아관사|구의|고서준|곽민재|하윤목|원장 서기/)
})
