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
    assert.ok(/^(?:수문호흡법|차륜망치|호위철벽진|없음\. 생업만\.)/u.test(detail.sections['무공'] ?? ''), heading.name)
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
    assert.ok(/^(?:수문호흡법|차륜망치|호위철벽진|기록단절법|없음\. 생업만\.)/u.test(detail.sections['무공'] ?? ''), heading.name)
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
    assert.ok(/^(?:기록단절법|차륜망치|호위철벽진|없음\. 생업만\.)/u.test(detail.sections['무공'] ?? ''), heading.name)
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
    assert.match(martialText, /무공\.\s*(?:차륜망치|기록단절법|수문호흡법|호위철벽진|없음\. 생업만\.)/u, id)
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
    '호위철벽진': 'K115 K116 K119 K123 K128 K129 K460 K508 K556 K604 K652 K700 K748 K796 K844 K892 K940 K988',
    '없음. 생업만.': 'K117 K131 K118 K125 K134 K136 K138 K139 K140 K141 K142 K428 K476 K524 K572 K620 K668 K716 K764 K812 K860 K908 K956',
    '수문호흡법': 'K121 K126 K127 K130 K133 K137 K444 K492 K540 K588 K636 K684 K732 K780 K828 K876 K924 K972 K143',
    '차륜망치': 'K132 K135 K120 K124',
    '기록단절법': 'K122',
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
    const martial = martialText.match(/무공\.\s*(호위철벽진|수문호흡법|차륜망치|기록단절법|없음\. 생업만\.)/u)?.[1]
    assert.equal(martial, expectedMartial.get(id), id)
    assert.ok(detail.sections['무공']?.startsWith(martial), id)
    assert.doesNotMatch(detail.sections['무공'], /생업:/u, id)
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
    '기록단절법': 'K144 K161 K145 K146 K147 K148 K151 K153 K154 K156 K159 K164 K166 K461 K509 K557 K605 K653 K701 K749 K797 K845 K893 K941 K989 K168',
    '없음. 생업만.': 'K157 K149 K152 K160 K162 K165 K167 K429 K445 K477 K493 K525 K541 K573 K589 K621 K637 K669 K685 K717 K733 K765 K781 K813 K829 K861 K877 K909 K925 K957 K973',
    '차륜망치': 'K158 K150',
    '수문호흡법': 'K155 K163',
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
    const martial = martialText.match(/무공\.\s*(기록단절법|차륜망치|수문호흡법|없음\. 생업만\.)/u)?.[1]
    assert.equal(martial, expectedMartial.get(id), id)
    assert.ok(detail.sections['무공']?.startsWith(martial), id)
  }
  assert.equal(seen.size, 61)
})

test('all 61 issued S07 K IDs retain sourced bilingual livelihoods and original martial states', async () => {
  const document = JSON.parse(await readFile(new URL('../../lore/characters/Cast-State-07.json', import.meta.url), 'utf8'))
  const markdown = await readFile(new URL('../../lore/characters/Cast-State-07.md', import.meta.url), 'utf8')
  assert.equal(markdown, renderLoreMarkdown(document, 'ko'))
  const registry = JSON.parse(await readFile(new URL('../../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const values = JSON.parse(await readFile(new URL('../../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const expectedMartial = new Map(Object.entries({
    '차륜망치': 'K169 K175 K192',
    '없음. 생업만.': 'K170 K182 K183 K171 K172 K173 K174 K176 K177 K179 K180 K184 K185 K186 K188 K191 K430 K446 K462 K478 K494 K510 K526 K542 K558 K574 K590 K606 K622 K638 K654 K670 K686 K702 K718 K734 K750 K766 K782 K798 K814 K830 K846 K862 K878 K894 K910 K926 K942 K958 K974 K990 K193',
    '호위철벽진': 'K178',
    '기록단절법': 'K181 K187',
    '수문호흡법': 'K189 K190',
  }).flatMap(([martial, ids]) => ids.split(' ').map((id) => [id, martial])))
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
    const occupations = fields.flatMap((item) => [...plain(item.ko).matchAll(/(?:^|\n)-?\s*생업: ([^\n]+)/gu)].map((match) => match[1]))
    assert.equal(occupations.length, 1, id)
    const occupation = occupations[0]
    assert.ok(occupation && occupation !== '미등록', id)
    assert.ok(fields.some((item) => /(?:^|\n)-?\s*Livelihood: \S/u.test(plain(item.en))), id)
    const field = (prefix) => fields.find((item) => plain(item.ko).startsWith(prefix))
    assert.notEqual(occupation, plain(field('품계: ').ko).slice(4), id)
    assert.notEqual(occupation, plain(field('직함: ').ko).slice(4), id)
    const detailMatches = values.flatMap((person, valueIndex) => person.name === heading.name && person.state === 'S07'
      ? [valueIndex + 1] : [])
    assert.equal(detailMatches.length, 1, id)
    const detailId = `person-${String(detailMatches[0]).padStart(4, '0')}`
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${detailId}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.id, detailId, id)
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.state, 'S07', id)
    assert.equal(detail.occupation, occupation, id)
    assert.equal(detail.fields['생업'], occupation, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-07#'), id)
    const martialText = blocks.flatMap((block) => block.kind === 'paragraph' ? [plain(block.text.ko)]
      : block.kind === 'list' ? block.items.map((item) => plain(item.ko)) : []).join('\n')
    const martial = martialText.match(/무공\.\s*(차륜망치|호위철벽진|기록단절법|수문호흡법|없음\. 생업만\.)/u)?.[1]
    assert.equal(martial, expectedMartial.get(id), id)
    assert.ok(detail.sections['무공']?.startsWith(martial), id)
  }
  assert.equal(seen.size, 61)
})

test('all 61 issued S08 K IDs retain sourced bilingual livelihoods and original martial states', async () => {
  const document = JSON.parse(await readFile(new URL('../../lore/characters/Cast-State-08.json', import.meta.url), 'utf8'))
  const markdown = await readFile(new URL('../../lore/characters/Cast-State-08.md', import.meta.url), 'utf8')
  assert.equal(markdown, renderLoreMarkdown(document, 'ko'))
  const registry = JSON.parse(await readFile(new URL('../../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const values = JSON.parse(await readFile(new URL('../../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const expectedMartial = new Map(Object.entries({
    '차륜망치': 'K208 K200',
    '호위철벽진': 'K203 K447 K495 K543 K591 K639 K687 K735 K783 K831 K879 K927 K975',
    '기록단절법': 'K206',
    '수문호흡법': 'K216 K218',
    '없음. 생업만.': 'K194 K199 K207 K211 K195 K196 K197 K198 K201 K202 K204 K205 K209 K210 K212 K213 K214 K215 K217 K431 K463 K479 K511 K527 K559 K575 K607 K623 K655 K671 K703 K719 K751 K767 K799 K815 K847 K863 K895 K911 K943 K959 K991',
  }).flatMap(([martial, ids]) => ids.split(' ').map((id) => [id, martial])))
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
    const occupations = fields.flatMap((item) => [...plain(item.ko).matchAll(/(?:^|\n)-?\s*생업: ([^\n]+)/gu)].map((match) => match[1]))
    assert.equal(occupations.length, 1, id)
    const occupation = occupations[0]
    assert.ok(occupation && occupation !== '미등록', id)
    assert.ok(fields.some((item) => /(?:^|\n)-?\s*Livelihood: \S/u.test(plain(item.en))), id)
    const field = (prefix) => fields.find((item) => plain(item.ko).startsWith(prefix))
    assert.notEqual(occupation, plain(field('품계: ').ko).slice(4), id)
    assert.notEqual(occupation, plain(field('직함: ').ko).slice(4), id)
    const detailMatches = values.flatMap((person, valueIndex) => person.name === heading.name && person.state === 'S08'
      ? [valueIndex + 1] : [])
    assert.equal(detailMatches.length, 1, id)
    const detailId = `person-${String(detailMatches[0]).padStart(4, '0')}`
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${detailId}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.id, detailId, id)
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.state, 'S08', id)
    assert.equal(detail.occupation, occupation, id)
    assert.equal(detail.fields['생업'], occupation, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-08#'), id)
    const martialText = blocks.flatMap((block) => block.kind === 'paragraph' ? [plain(block.text.ko)]
      : block.kind === 'list' ? block.items.map((item) => plain(item.ko)) : []).join('\n')
    const martial = martialText.match(/무공\.\s*(차륜망치|호위철벽진|기록단절법|수문호흡법|없음\. 생업만\.)/u)?.[1]
    assert.equal(martial, expectedMartial.get(id), id)
    assert.ok(detail.sections['무공']?.startsWith(martial), id)
    assert.doesNotMatch(detail.sections['무공'], /생업:/u, id)
  }
  assert.equal(seen.size, 61)
})

test('all 62 issued S09 K IDs retain card-backed bilingual livelihoods and original martial states', async () => {
  const document = JSON.parse(await readFile(new URL('../../lore/characters/Cast-State-09.json', import.meta.url), 'utf8'))
  const registry = JSON.parse(await readFile(new URL('../../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const values = JSON.parse(await readFile(new URL('../../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const expectedMartial = new Map(Object.entries({
    '없음. 생업만.': 'K219 K220 K223 K224 K226 K227 K229 K230 K232 K234 K235 K236 K237 K240 K241 K242 K432 K448 K480 K496 K528 K544 K576 K592 K624 K640 K672 K688 K720 K736 K768 K784 K816 K832 K864 K880 K912 K928 K960 K976 K244',
    '기록단절법': 'K221 K222 K231 K233 K238 K239 K243',
    '차륜망치': 'K225 K464 K512 K560 K608 K656 K704 K752 K800 K848 K896 K944 K992',
    '호위철벽진': 'K228',
  }).flatMap(([martial, ids]) => ids.split(' ').map((id) => [id, martial])))
  assert.equal(expectedMartial.size, 62)
  const plain = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('')
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: plain(block.text.ko).replace(/^인물 /u, ''), index }] : [])
  assert.equal(headings.length, 62)
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
    const title = fields.find((item) => plain(item.ko).startsWith('직함: '))
    const rank = fields.find((item) => plain(item.ko).startsWith('품계: '))
    assert.notEqual(occupation, plain(title.ko).slice(4).split('\n')[0], id)
    assert.notEqual(occupation, plain(rank.ko).slice(4), id)
    const detailMatches = values.flatMap((person, valueIndex) => person.name === heading.name && person.state === 'S09'
      ? [valueIndex + 1] : [])
    assert.equal(detailMatches.length, 1, id)
    const detailId = `person-${String(detailMatches[0]).padStart(4, '0')}`
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/${detailId}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.id, detailId, id)
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.state, 'S09', id)
    assert.equal(detail.occupation, occupation, id)
    assert.equal(detail.fields['생업'], occupation, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-09#'), id)
    const martialText = blocks.flatMap((block) => block.kind === 'paragraph' ? [plain(block.text.ko)]
      : block.kind === 'list' ? block.items.map((item) => plain(item.ko)) : []).join('\n')
    const martial = martialText.match(/무공\.\s*(기록단절법|차륜망치|호위철벽진|없음\. 생업만\.)/u)?.[1]
    assert.equal(martial, expectedMartial.get(id), id)
    assert.ok(detail.sections['무공']?.startsWith(martial), id)
    assert.doesNotMatch(detail.sections['무공'], /생업:/u, id)
  }
  assert.equal(seen.size, 62)
})

test('S10 issued cards retain card-backed bilingual livelihoods and original martial states', async () => {
  const document = JSON.parse(await readFile(new URL('../../lore/characters/Cast-State-10.json', import.meta.url), 'utf8'))
  const registry = JSON.parse(await readFile(new URL('../../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const values = JSON.parse(await readFile(new URL('../../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const idByName = new Map(registry.persons.map((person) => [person.name, person.id]))
  const plain = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('')
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: plain(block.text.ko).replace(/^인물 /u, ''), index }] : [])
  assert.equal(headings.length, 62)
  const seen = new Set()
  for (const [index, heading] of headings.entries()) {
    const id = idByName.get(heading.name)
    assert.ok(id && !seen.has(id), heading.name)
    seen.add(id)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const occupation = fields.filter((item) => plain(item.ko).startsWith('생업: '))
    assert.equal(occupation.length, 1, id)
    assert.match(plain(occupation[0].en), /^Livelihood: \S/u, id)
    const livelihood = plain(occupation[0].ko).slice(4)
    assert.ok(livelihood && livelihood !== '미등록', id)
    const detailIndex = values.findIndex((person) => person.name === heading.name && person.state === 'S10')
    assert.ok(detailIndex >= 0, id)
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/person-${String(detailIndex + 1).padStart(4, '0')}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.occupation, livelihood, id)
    assert.equal(detail.fields['생업'], livelihood, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-10#'), id)
    const martial = detail.sections['무공']
    assert.match(martial, /^(?:없음\. 생업만\.|없음\. 강호 갈래는 안국총림 안의 개방 무공\.|수문호흡법|기록단절법|차륜망치|호위철벽진)/u, id)
    assert.doesNotMatch(martial, /생업:/u, id)
  }
  assert.equal(seen.size, 62)
})

test('S11 issued cards retain card-backed bilingual livelihoods and original martial states', async () => {
  const document = JSON.parse(await readFile(new URL('../../lore/characters/Cast-State-11.json', import.meta.url), 'utf8'))
  const registry = JSON.parse(await readFile(new URL('../../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const values = JSON.parse(await readFile(new URL('../../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const idByName = new Map(registry.persons.map((person) => [person.name, person.id]))
  const plain = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('')
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: plain(block.text.ko).replace(/^인물 /u, ''), index }] : [])
  assert.equal(headings.length, 61)
  const seen = new Set()
  for (const [index, heading] of headings.entries()) {
    const id = idByName.get(heading.name)
    assert.ok(id && !seen.has(id), heading.name)
    seen.add(id)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const occupations = fields.filter((item) => plain(item.ko).startsWith('생업: '))
    assert.equal(occupations.length, 1, id)
    assert.match(plain(occupations[0].en), /^Livelihood: \S/u, id)
    const livelihood = plain(occupations[0].ko).slice(4)
    assert.ok(livelihood && livelihood !== '미등록', id)
    const detailIndex = values.findIndex((person) => person.name === heading.name && person.state === 'S11')
    assert.ok(detailIndex >= 0, id)
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/person-${String(detailIndex + 1).padStart(4, '0')}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.occupation, livelihood, id)
    assert.equal(detail.fields['생업'], livelihood, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-11#'), id)
    const martialText = blocks.flatMap((block) => block.kind === 'paragraph' ? [plain(block.text.ko)]
      : block.kind === 'list' ? block.items.map((item) => plain(item.ko)) : []).join('\n')
    const martial = martialText.match(/무공\.\*{0,2}\s*(없음\. 생업만\.|차륜망치|기록단절법|호위철벽진|수문호흡법)/u)?.[1]
    assert.ok(martial, id)
    assert.ok(detail.sections['무공']?.startsWith(martial), id)
    assert.doesNotMatch(detail.sections['무공'], /생업:/u, id)
  }
  assert.equal(seen.size, 61)
})

test('S12 issued cards retain card-backed bilingual livelihoods and original martial states', async () => {
  const document = JSON.parse(await readFile(new URL('../../lore/characters/Cast-State-12.json', import.meta.url), 'utf8'))
  const registry = JSON.parse(await readFile(new URL('../../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const values = JSON.parse(await readFile(new URL('../../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const idByName = new Map(registry.persons.map((person) => [person.name, person.id]))
  const plain = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('')
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: plain(block.text.ko).replace(/^인물 /u, ''), index }] : [])
  assert.equal(headings.length, 62)
  const seen = new Set()
  for (const [index, heading] of headings.entries()) {
    const id = idByName.get(heading.name)
    assert.ok(id && !seen.has(id), heading.name)
    seen.add(id)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const occupations = fields.filter((item) => plain(item.ko).startsWith('생업: '))
    assert.equal(occupations.length, 1, id)
    assert.match(plain(occupations[0].en), /^Livelihood: \S/u, id)
    const livelihood = plain(occupations[0].ko).slice(4)
    assert.ok(livelihood && livelihood !== '미등록', id)
    const detailIndex = values.findIndex((person) => person.name === heading.name && person.state === 'S12')
    assert.ok(detailIndex >= 0, id)
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/person-${String(detailIndex + 1).padStart(4, '0')}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.occupation, livelihood, id)
    assert.equal(detail.fields['생업'], livelihood, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-12#'), id)
    const martialText = blocks.flatMap((block) => block.kind === 'paragraph' ? [plain(block.text.ko)]
      : block.kind === 'list' ? block.items.map((item) => plain(item.ko)) : []).join('\n')
    const martial = martialText.match(/무공\.\*{0,2}\s*(없음\. 생업만\.|차륜망치|기록단절법|호위철벽진)/u)?.[1]
    assert.ok(martial, id)
    assert.ok(detail.sections['무공']?.startsWith(martial), id)
    assert.doesNotMatch(detail.sections['무공'], /생업:/u, id)
  }
  assert.equal(seen.size, 62)
})

test('S13 issued cards retain card-backed bilingual livelihoods and original martial states', async () => {
  const document = JSON.parse(await readFile(new URL('../../lore/characters/Cast-State-13.json', import.meta.url), 'utf8'))
  const registry = JSON.parse(await readFile(new URL('../../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const values = JSON.parse(await readFile(new URL('../../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const idByName = new Map(registry.persons.map((person) => [person.name, person.id]))
  const plain = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('')
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: plain(block.text.ko).replace(/^인물 /u, ''), index }] : [])
  assert.equal(headings.length, 62)
  const seen = new Set()
  for (const [index, heading] of headings.entries()) {
    const id = idByName.get(heading.name)
    assert.ok(id && !seen.has(id), heading.name)
    seen.add(id)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const occupations = fields.filter((item) => plain(item.ko).startsWith('생업: '))
    assert.equal(occupations.length, 1, id)
    assert.match(plain(occupations[0].en), /^Livelihood: \S/u, id)
    const livelihood = plain(occupations[0].ko).slice(4)
    assert.ok(livelihood && livelihood !== '미등록', id)
    const detailIndex = values.findIndex((person) => person.name === heading.name && person.state === 'S13')
    assert.ok(detailIndex >= 0, id)
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/person-${String(detailIndex + 1).padStart(4, '0')}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.occupation, livelihood, id)
    assert.equal(detail.fields['생업'], livelihood, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-13#'), id)
    const martialText = blocks.flatMap((block) => block.kind === 'paragraph' ? [plain(block.text.ko)]
      : block.kind === 'list' ? block.items.map((item) => plain(item.ko)) : []).join('\n')
    const martial = martialText.match(/무공\.\*{0,2}\s*(없음\. 생업만\.|차륜망치|기록단절법|호위철벽진)/u)?.[1]
    assert.ok(martial, id)
    assert.ok(detail.sections['무공']?.startsWith(martial), id)
    assert.doesNotMatch(detail.sections['무공'], /생업:/u, id)
  }
  assert.equal(seen.size, 62)
})

test('S14 issued cards retain card-backed bilingual livelihoods and original martial states', async () => {
  const document = JSON.parse(await readFile(new URL('../../lore/characters/Cast-State-14.json', import.meta.url), 'utf8'))
  const registry = JSON.parse(await readFile(new URL('../../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const values = JSON.parse(await readFile(new URL('../../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const idByName = new Map(registry.persons.map((person) => [person.name, person.id]))
  const plain = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('')
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: plain(block.text.ko).replace(/^인물 /u, ''), index }] : [])
  assert.equal(headings.length, 61)
  const seen = new Set()
  for (const [index, heading] of headings.entries()) {
    const id = idByName.get(heading.name)
    assert.ok(id && !seen.has(id), heading.name)
    seen.add(id)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const occupations = fields.filter((item) => plain(item.ko).startsWith('생업: '))
    assert.equal(occupations.length, 1, id)
    assert.match(plain(occupations[0].en), /^Livelihood: \S/u, id)
    const livelihood = plain(occupations[0].ko).slice(4)
    assert.ok(livelihood && livelihood !== '미등록', id)
    const detailIndex = values.findIndex((person) => person.name === heading.name && person.state === 'S14')
    assert.ok(detailIndex >= 0, id)
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/person-${String(detailIndex + 1).padStart(4, '0')}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.occupation, livelihood, id)
    assert.equal(detail.fields['생업'], livelihood, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-14#'), id)
    const martialText = blocks.flatMap((block) => block.kind === 'paragraph' ? [plain(block.text.ko)]
      : block.kind === 'list' ? block.items.map((item) => plain(item.ko)) : []).join('\n')
    const martial = martialText.match(/무공\.\*{0,2}\s*(없음\. 생업만\.|차륜망치|기록단절법|호위철벽진|수문호흡법)/u)?.[1]
    assert.ok(martial, id)
    assert.ok(detail.sections['무공']?.startsWith(martial), id)
    assert.doesNotMatch(detail.sections['무공'], /생업:/u, id)
  }
  assert.equal(seen.size, 61)
  const core = JSON.parse(await readFile(new URL('../../lore/characters/Core-Characters.json', import.meta.url), 'utf8'))
  const coreTak = core.content.find((block) => block.anchor === '탁서윤-p3')
  assert.match(plain(coreTak.text.ko), /생업 별명은 ([^.]+)\./u)
  const takDetail = JSON.parse(await readFile(new URL('../public/person-details/person-1006.json', import.meta.url), 'utf8'))
  assert.equal(takDetail.name, '탁서윤')
  assert.equal(takDetail.occupation, plain(coreTak.text.ko).match(/생업 별명은 ([^.]+)\./u)[1])
  assert.match(takDetail.sections['무공'] ?? '', /^호위철벽진/u)
})

test('S15 issued cards retain card-backed bilingual livelihoods and original martial states', async () => {
  const document = JSON.parse(await readFile(new URL('../../lore/characters/Cast-State-15.json', import.meta.url), 'utf8'))
  const registry = JSON.parse(await readFile(new URL('../../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const values = JSON.parse(await readFile(new URL('../../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const idByName = new Map(registry.persons.map((person) => [person.name, person.id]))
  const plain = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('')
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: plain(block.text.ko).replace(/^인물 /u, ''), index }] : [])
  assert.equal(headings.length, 61)
  const seen = new Set()
  for (const [index, heading] of headings.entries()) {
    const id = idByName.get(heading.name)
    assert.ok(id && !seen.has(id), heading.name)
    seen.add(id)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const occupations = fields.filter((item) => plain(item.ko).startsWith('생업: '))
    assert.equal(occupations.length, 1, id)
    assert.match(plain(occupations[0].en), /^Livelihood: \S/u, id)
    const livelihood = plain(occupations[0].ko).slice(4)
    assert.ok(livelihood && livelihood !== '미등록', id)
    const detailIndex = values.findIndex((person) => person.name === heading.name && person.state === 'S15')
    assert.ok(detailIndex >= 0, id)
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/person-${String(detailIndex + 1).padStart(4, '0')}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.occupation, livelihood, id)
    assert.equal(detail.fields['생업'], livelihood, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-15#'), id)
    const martialText = blocks.flatMap((block) => block.kind === 'paragraph' ? [plain(block.text.ko)]
      : block.kind === 'list' ? block.items.map((item) => plain(item.ko)) : []).join('\n')
    const martial = martialText.match(/무공\.\*{0,2}\s*(없음\. 생업만\.|차륜망치|기록단절법|호위철벽진|수문호흡법)/u)?.[1]
    assert.ok(martial, id)
    assert.ok(detail.sections['무공']?.startsWith(martial), id)
    assert.doesNotMatch(detail.sections['무공'], /생업:/u, id)
  }
  assert.equal(seen.size, 61)
})

test('S16 issued cards retain card-backed bilingual livelihoods and original martial states', async () => {
  const document = JSON.parse(await readFile(new URL('../../lore/characters/Cast-State-16.json', import.meta.url), 'utf8'))
  const registry = JSON.parse(await readFile(new URL('../../lore/name-pools/person-id-registry.json', import.meta.url), 'utf8'))
  const values = JSON.parse(await readFile(new URL('../../lore/name-pools/values-cast.json', import.meta.url), 'utf8')).people
  const idByName = new Map(registry.persons.map((person) => [person.name, person.id]))
  const plain = (value) => typeof value === 'string' ? value : value.map((run) => run.text).join('')
  const headings = document.content.flatMap((block, index) => block.kind === 'heading' && block.depth === 3
    ? [{ name: plain(block.text.ko).replace(/^인물 /u, ''), index }] : [])
  assert.equal(headings.length, 61)
  const seen = new Set()
  for (const [index, heading] of headings.entries()) {
    const id = idByName.get(heading.name)
    assert.ok(id && !seen.has(id), heading.name)
    seen.add(id)
    const blocks = document.content.slice(heading.index + 1, headings[index + 1]?.index)
    const fields = blocks.filter((block) => block.kind === 'list').flatMap((block) => block.items)
    const occupations = fields.filter((item) => plain(item.ko).startsWith('생업: '))
    assert.equal(occupations.length, 1, id)
    assert.match(plain(occupations[0].en), /^Livelihood: \S/u, id)
    const livelihood = plain(occupations[0].ko).slice(4)
    assert.ok(livelihood && livelihood !== '미등록', id)
    const detailIndex = values.findIndex((person) => person.name === heading.name && person.state === 'S16')
    assert.ok(detailIndex >= 0, id)
    const detail = JSON.parse(await readFile(new URL(`../public/person-details/person-${String(detailIndex + 1).padStart(4, '0')}.json`, import.meta.url), 'utf8'))
    assert.equal(detail.name, heading.name, id)
    assert.equal(detail.occupation, livelihood, id)
    assert.equal(detail.fields['생업'], livelihood, id)
    assert.ok(detail.sourceRoute.startsWith('/world/Cast-State-16#'), id)
    const martialText = blocks.flatMap((block) => block.kind === 'paragraph' ? [plain(block.text.ko)]
      : block.kind === 'list' ? block.items.map((item) => plain(item.ko)) : []).join('\n')
    const martial = martialText.match(/무공\.\*{0,2}\s*(없음\. 생업만\.|차륜망치|기록단절법|호위철벽진|수문호흡법)/u)?.[1]
    assert.ok(martial, id)
    assert.ok(detail.sections['무공']?.startsWith(martial), id)
    assert.doesNotMatch(detail.sections['무공'], /생업:/u, id)
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

test('Jo Jaepyo has the landing formation without an invented Marine Corps service record', async () => {
  const detail = JSON.parse(await readFile(new URL('../public/person-details/person-1003.json', import.meta.url), 'utf8'))
  assert.equal(detail.name, '조재표')
  assert.match(detail.sections['무공'], /^호위철벽진의 상륙호위진\./u)
  assert.match(detail.sections['무공'], /해병대 복무.*미확인/u)
  assert.equal(detail.sourceRoute, '/world/Cast-Unaffiliated#인물-조재표')
})

test('Lee Yeon has the escort formation without invented firearm access or service', async () => {
  const detail = JSON.parse(await readFile(new URL('../public/person-details/person-1004.json', import.meta.url), 'utf8'))
  assert.equal(detail.name, '이연')
  assert.match(detail.sections['무공'], /^호위철벽진의 상륙호위진\./u)
  assert.match(detail.sections['무공'], /총기 접근과 복무 이력은 미확인/u)
  assert.equal(detail.sourceRoute, '/world/Cast-Unaffiliated#인물-이연')
})

test('Min Woonggi practices judo separately from his repair trade', async () => {
  const detail = JSON.parse(await readFile(new URL('../public/person-details/person-1008.json', import.meta.url), 'utf8'))
  assert.equal(detail.name, '민웅기')
  assert.match(detail.sections['무공'], /^유도\./u)
  assert.match(detail.sections['무공'], /징집 이력과 무기·탄약 접근은 미확인/u)
  assert.doesNotMatch(detail.sections['무공'], /공동 서사|조재표와 이연/u)
  assert.doesNotMatch(detail.biography, /공동 서사|왜 따르는가/u)
  assert.equal(detail.sourceRoute, '/world/Cast-Unaffiliated#인물-민웅기')
})

test('Shin Jongmok has an opening objective grounded in his return-net work', async () => {
  const detail = JSON.parse(await readFile(new URL('../public/person-details/person-1009.json', import.meta.url), 'utf8'))
  assert.equal(detail.name, '신종목')
  assert.ok(detail.sections['야망'])
  assert.equal(detail.sourceRoute, '/world/Core-Characters#신종목')
})

test('Kim Yeongyu has an opening objective without claiming approval', async () => {
  const detail = JSON.parse(await readFile(new URL('../public/person-details/person-1007.json', import.meta.url), 'utf8'))
  assert.equal(detail.name, '김연규')
  assert.ok(detail.sections['야망'])
  assert.equal(detail.sourceRoute, '/world/Core-Characters#김연규')
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
