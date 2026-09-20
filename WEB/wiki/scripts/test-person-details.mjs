import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'

test('all canonical people expose unique detail routes and structured data', async () => {
  const catalog = await readFile(new URL('../src/generated/peopleCatalog.ts', import.meta.url), 'utf8')
  const routes = [...catalog.matchAll(/"detailRoute": "([^"]+)"/g)].map((match) => match[1])
  const detailRoot = new URL('../public/person-details/', import.meta.url)
  const names = (await readdir(detailRoot)).filter((name) => name.endsWith('.json'))
  assert.equal(routes.length, 1004)
  assert.equal(new Set(routes).size, 1004)
  assert.ok(routes.every((route) => /^\/people\/person-\d{4}$/u.test(route)))
  assert.equal(names.length, 1004)
  const heroIds = []
  const heroClasses = new Set(['line_warden', 'breach_lead', 'field_coordinator', 'recovery_specialist', 'route_operative', 'expedition_anchor'])
  for (const name of names) {
    const detail = JSON.parse(await readFile(new URL(name, detailRoot), 'utf8'))
    heroIds.push(detail.heroId)
    assert.match(detail.heroId, /^hero-person-\d{4}$/u, name)
    assert.ok(heroClasses.has(detail.heroClassId), `${name}:${detail.heroClassId}`)
    assert.ok(detail.heroClass.length > 0, name)
    assert.ok(Array.isArray(detail.battleRoleTags), name)
    assert.ok(Array.isArray(detail.effectFamilies) && detail.effectFamilies.length > 0, name)
    assert.ok(Array.isArray(detail.campaignRoles), name)
    assert.equal(typeof detail.commandEligible, 'boolean', name)
    assert.ok(detail.biography.length > 0, name)
    assert.equal(Object.keys(detail.values).length, 10, name)
    assert.equal(Object.keys(detail.desire).length, 7, name)
    assert.ok(['여성', '남성'].includes(detail.gender), name)
    assert.ok(detail.position.length > 0, name)
    assert.ok(detail.rank.length > 0, name)
    assert.ok(detail.occupation.length > 0, name)
  }
  assert.equal(new Set(heroIds).size, 1004)
})

test('person detail page renders tables and the canonical prose sections', async () => {
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const page = await readFile(new URL('../src/pages/PersonDetailPage.tsx', import.meta.url), 'utf8')
  assert.match(app, /path="\/people\/:personId"/)
  assert.match(page, /기본 정보/)
  assert.match(page, /가치관/)
  assert.match(page, /욕망/)
  assert.match(page, /정본 상세/)
  assert.match(page, /영웅 클래스/)
  assert.match(page, /전투 역할/)
  assert.match(page, /캠페인 역할/)
  for (const label of ['진형', '엄호', '사기', '피지컬 에이아이 기술', '외교', '암살', '방해 공작', '정보 활동']) assert.match(page, new RegExp(label))
  for (const label of ['생애', '관직', '무공', '일화', '가문', '관계', '야망', '공포', '개입']) assert.match(page, new RegExp(label))
  assert.match(page, /정본에 별도 산문이 등록되지 않았습니다/)
})
