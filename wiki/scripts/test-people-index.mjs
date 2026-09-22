import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'

test('all canonical people are indexed and linked to a canon card', async () => {
  const catalog = await readFile(new URL('../src/generated/peopleCatalog.ts', import.meta.url), 'utf8')
  const count = Number(catalog.match(/peopleCount = (\d+)/)?.[1])
  const names = [...catalog.matchAll(/"name": "([^"]+)"/g)].map((match) => match[1])
  const sourceRoutes = [...catalog.matchAll(/"sourceRoute": "([^"]+)"/g)].map((match) => match[1])
  const detailRoutes = [...catalog.matchAll(/"detailRoute": "([^"]+)"/g)].map((match) => match[1])
  assert.equal(count, 1004)
  assert.equal(names.length, 1004)
  assert.equal(new Set(names).size, 1004)
  assert.equal(sourceRoutes.length, 1004)
  assert.equal(detailRoutes.length, 1004)
  assert.equal(new Set(detailRoutes).size, 1004)
  assert.ok(sourceRoutes.every((route) => route.startsWith('/world/') && route.includes('#')))
  const genders = [...catalog.matchAll(/"gender": "([^"]+)"/g)].map((match) => match[1])
  assert.equal(genders.length, 1004)
  assert.ok(genders.every((gender) => gender === '여성' || gender === '남성'))
  assert.equal(sourceRoutes.filter((route) => route.startsWith('/world/Core-Characters#인물-')).length, 0)
  for (const route of sourceRoutes) {
    const [document, anchor] = route.replace('/world/', '').split('#')
    const markdown = await readFile(resolve(import.meta.dirname, `../../lore/characters/${document}.md`), 'utf8')
    const expected = anchor.startsWith('인물-') ? `### 인물 ${anchor.slice(3)}` : `## ${anchor}`
    assert.ok(markdown.includes(expected), route)
  }
})

test('people search route is linked from wiki navigation', async () => {
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const links = await readFile(new URL('../src/wikiLinks.ts', import.meta.url), 'utf8')
  assert.match(app, /path="\/people"/)
  assert.match(links, /characters: '\/people'/)
})

test('people page sorts the complete roster by Korean name order', async () => {
  const page = await readFile(new URL('../src/pages/PeoplePage.tsx', import.meta.url), 'utf8')
  assert.match(page, /Intl\.Collator\('ko-KR'/)
  assert.match(page, /peopleByName/)
  assert.match(page, /koreanNameOrder\.compare\(left\.name, right\.name\)/)
})

test('people page exposes state common tier occupation and gender filters and required columns', async () => {
  const page = await readFile(new URL('../src/pages/PeoplePage.tsx', import.meta.url), 'utf8')
  for (const label of ['국가', '직급(공통 티어)', '직업', '성별']) assert.ok(page.includes(label), label)
  assert.doesNotMatch(page, /<label>직위<select/)
  for (const field of ['stateName', 'position', 'commonTier', 'occupation', 'gender']) assert.match(page, new RegExp(`person\\.${field}`))
  assert.match(page, /필터 초기화/)
})

test('people table reserves an on-screen semantic column for gender', async () => {
  const page = await readFile(new URL('../src/pages/PeoplePage.tsx', import.meta.url), 'utf8')
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8')
  assert.match(page, /<colgroup>/)
  assert.match(page, /className="people-col-gender"/)
  assert.match(page, /<th scope="col">성별<\/th>/)
  assert.match(css, /\.people-table\s*\{[^}]*table-layout:\s*fixed/s)
  assert.match(css, /\.people-col-gender\s*\{[^}]*inline-size:/s)
})

test('people page states the confirmed hero contract without auto-assigning proposed classes', async () => {
  const page = await readFile(new URL('../src/pages/PeoplePage.tsx', import.meta.url), 'utf8')
  const generator = await readFile(new URL('./generate-catalog.mjs', import.meta.url), 'utf8')

  assert.match(page, /1,004명은 모두 영웅 인물/)
  assert.match(page, /전투·지원·치유·정보 활동에서 서로 다른 클래스와 특성/)
  assert.match(page, /전투 클래스 이름과 개인별 배정은 아직 확정되지 않았/)
  assert.doesNotMatch(generator, /heroClass/)
  assert.doesNotMatch(generator, /campaignRole/)
})
