import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'

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
