// opening-feudal-allocation.v1 배분 검증 계약 테스트 — 작은 고정 fixture만 사용한다.
// 입력 점유·규모 상태는 전부 fixture가 넘겨주는 값이며 모듈이 개수를 알고 있지 않음을 함께 확인한다.
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { test } from 'vitest'
import { projectOpeningFeudalAllocation } from './opening-feudal-allocation.mjs'

test('canonical allocation reproduces every published holding and person title', () => {
  const json = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'))
  const people = readdirSync(new URL('../public/person-details/', import.meta.url)).filter(file => file.endsWith('.json')).map(file => json('public/person-details/' + file))
  const control = json('public/outside-control-2126.json')
  const projected = projectOpeningFeudalAllocation({
    allocation: json('lore/relations/opening-feudal-allocation.json'),
    existing: json('lore/relations/personal-holdings.json'),
    people: people.map(person => ({ id: person.characterId, name: person.name, state: person.state })),
    seoul: json('public/opening-territories.json'),
    outside: { ...json('public/outside-admin-units.json'), islands: control.assignments.filter(unit => unit.components).map(unit => ({ unitId: unit.unitId, components: unit.components })) },
    control, affiliation: json('lore/factions/Sixteen-States.json').data.currentAffiliation,
    scale: json('public/admin-territorial-scale.json'),
  })
  assert.deepEqual(projected, json('public/confirmed-person-holdings.json'))
  for (const person of people) {
    assert.deepEqual(person.confirmedHoldings, projected.holdings.filter(holding => holding.holderPersonId === person.characterId), person.characterId)
    assert.deepEqual((person.openingTitles ?? []).map(title => title.id), projected.titles.filter(title => title.holderPersonId === person.characterId).map(title => title.id), person.characterId)
  }
})

test('owner-directed Chungcheong duchy belongs to K998 across all three cities', () => {
  const allocation = JSON.parse(readFileSync(new URL('../lore/relations/opening-feudal-allocation.json', import.meta.url), 'utf8'))
  const title = allocation.titles.find(row => row.id === 'title:duchy-chungcheong-k998')
  assert.equal(title.holderPersonId, 'K998')
  assert.equal(title.rank, 'duchy')
  assert.equal(title.parentTitleId, 'title:kingdom-s02')
  assert.equal(title.jurisdictionRefs.length, 72)
  const prefixes = new Set(title.jurisdictionRefs.map(id => id.slice(0, 5)))
  assert.deepEqual([...prefixes].sort(), ['36110', '44131', '44133', '44200'])
  const children = allocation.titles.filter(row => row.parentTitleId === title.id)
  assert.equal(children.length, 43)
  assert.ok(children.every(child => child.rank === 'barony'))
  const childIds = new Set(children.map(child => child.id))
  const grants = allocation.grants.filter(row => childIds.has(row.titleId))
  const direct = grants.filter(grant => grant.holderPersonId === 'K998')
  const vassals = grants.filter(grant => grant.holderPersonId !== 'K998')
  assert.deepEqual(direct.flatMap(grant => grant.adminRefs.map(ref => ref.id)).sort(), ['3611025000', '4420033000'])
  assert.equal(vassals.flatMap(grant => grant.adminRefs).length, 70)
  assert.ok(vassals.every(grant => grant.directLiegePersonId === 'K998'))
  assert.equal(new Set(grants.flatMap(grant => grant.adminRefs.map(ref => ref.id))).size, 72)
})

const heldAuthority = { kind: 'state', stateId: 'S01', name: '한강왕국' }
const hegemons = { hegemons: [{ kind: 'state', name: '한강왕국', stateId: 'S01', memberStateIds: ['S01', 'S02'] }] }
const people = [
  { id: 'K001', name: '왕 인물', state: 'S01' },
  { id: 'K002', name: '공작 인물', state: 'S01' },
  { id: 'K003', name: '무토지 인물', state: 'S01' },
  { id: 'K004', name: '기사 인물', state: 'S02' },
]
const seoul = { regions: [
  { id: 'region:1111051500', name: '청운효자동', polities: ['S01'] },
  { id: 'region:1111053000', name: '신문로1가동', polities: ['S01'] },
  { id: 'region:1111054000', name: '신문로2가동', polities: [] },
] }
const outside = {
  units: [
    { id: '2812551000', name: '한강왕국 제물포 신포동' },
    { id: '2820069500', name: '한강왕국 수원 매산동' },
    { id: '2815551000', name: '한강왕국 강화 강화동' },
  ],
  islands: [{
    unitId: '2815551000',
    components: [
      { componentIndex: 0, authority: heldAuthority },
      { componentIndex: 1, authority: null },
    ],
  }],
}
const control = { assignments: [
  { unitId: '2812551000', authority: heldAuthority },
  { unitId: '2820069500', authority: heldAuthority },
  { unitId: '2815551000', authority: null },
] }
const scale = { rows: [
  { adminId: 'region:1111051500', status: 'projected' },
  { adminId: 'region:1111053000', status: 'projected' },
  { adminId: '2812551000', status: 'projected' },
  { adminId: '2820069500', status: 'HOLD' },
  { adminId: '2815551000', status: 'projected' },
] }
const existing = {
  schema: 'confirmed-person-holdings.v1',
  openingYear: 2126,
  polities: [{ stateId: 'S01', name: '한강왕국' }],
  retinue: [{ personId: 'K002', role: '왕실 기사' }],
  openingDispositions: [
    { personId: 'K003', status: 'personal-landless', approvalRef: 'owner:fixture:s01_holding_k003' },
  ],
  holdings: [{
    id: 'holding:fixture-ex1',
    name: { ko: '기존 역 직영지' },
    holderPersonId: 'K001',
    directLiegePersonId: null,
    stateId: 'S01',
    stationRef: { stationId: 'sinmun', stationName: '신문로' },
    adminRefs: [{ id: 'region:1111053000', name: '신문로1가동' }],
    geometrySource: null,
    territorialScale: null,
    formalTitleRank: null,
  }],
}
const titles = [
  { id: 'title:kingdom-han', name: '한강왕국', rank: 'kingdom', holderPersonId: 'K001', stateId: 'S01',
    parentTitleId: null, jurisdictionRefs: ['region:1111051500', 'region:1111053000', '2812551000', '2820069500'], basis: 'fixture 개막 왕급 결정' },
  { id: 'title:duchy-jemulpo', name: '제물포 공작령', rank: 'duchy', holderPersonId: 'K002', stateId: 'S01',
    parentTitleId: 'title:kingdom-han', jurisdictionRefs: ['region:1111051500'], basis: 'fixture 개막 공작급 결정' },
  { id: 'title:duchy-royal', name: '왕실 공작령', rank: 'duchy', holderPersonId: 'K001', stateId: 'S01',
    parentTitleId: 'title:kingdom-han', jurisdictionRefs: ['region:1111053000', '2812551000', '2820069500'], basis: 'fixture 개막 왕 보유 공작급 결정' },
  { id: 'title:barony-jemulpo', name: '제물포 남작령', rank: 'barony', holderPersonId: 'K004', stateId: 'S01',
    parentTitleId: 'title:duchy-jemulpo', jurisdictionRefs: [], basis: 'fixture 개막 남작급 결정' },
]
const grants = [
  { id: 'holding:fixture-jemulpo', name: { ko: '제물포 공작 직영지' }, holderPersonId: 'K002', directLiegePersonId: 'K001',
    stateId: 'S01', adminRefs: [{ id: 'region:1111051500', name: '청운효자동' }], componentRefs: [],
    titleId: 'title:duchy-jemulpo', geometrySource: null, territorialScale: null, formalTitleRank: null },
  { id: 'holding:fixture-royal', name: { ko: '왕실 공작 직영지' }, holderPersonId: 'K001', directLiegePersonId: null,
    stateId: 'S01', adminRefs: [
      { id: '2812551000', name: '한강왕국 제물포 신포동' },
      { id: '2820069500', name: '한강왕국 수원 매산동' },
    ], componentRefs: [], titleId: 'title:duchy-royal', geometrySource: null, territorialScale: null, formalTitleRank: null },
  { id: 'holding:fixture-ganghwa', name: { ko: '강화 남작 섬령' }, holderPersonId: 'K004', directLiegePersonId: 'K002',
    stateId: 'S01', adminRefs: [], componentRefs: [{ unitId: '2815551000', componentIndex: 0 }],
    titleId: 'title:barony-jemulpo', geometrySource: null, territorialScale: null, formalTitleRank: 'barony' },
]
const bindings = [{ holdingId: 'holding:fixture-ex1', titleId: 'title:duchy-royal' }]

const fixture = () => ({
  allocation: {
    schema: 'opening-feudal-allocation.v1',
    titles: structuredClone(titles),
    grants: structuredClone(grants),
    existingTitleBindings: structuredClone(bindings),
  },
  existing: structuredClone(existing),
  people: structuredClone(people),
  seoul: structuredClone(seoul),
  outside: structuredClone(outside),
  control: structuredClone(control),
  affiliation: structuredClone(hegemons),
  scale: structuredClone(scale),
})

const throws = (mutate, code) => {
  const args = fixture()
  mutate(args)
  assert.throws(() => projectOpeningFeudalAllocation(args), new RegExp(code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
}

test('grants must stay inside their title jurisdiction and title jurisdictions inside their political realm', () => {
  throws(args => { args.allocation.titles[1].jurisdictionRefs = [] }, 'E_GRANT_TITLE_JURISDICTION:holding:fixture-jemulpo')
  throws(args => { args.control.assignments[0].authority = { kind: 'state', stateId: 'S03', name: '다른 왕국' } }, 'E_TITLE_CONTROL_REALM:title:kingdom-han')
})

test('a preserved personal liege mismatch requires an explicit separate relationship contract', () => {
  throws(args => {
    args.existing.holdings[0].directLiegePersonId = 'K002'
  }, 'E_BINDING_LIEGE:holding:fixture-ex1')
  const args = fixture()
  args.existing.holdings[0].directLiegePersonId = 'K002'
  args.allocation.existingTitleBindings[0].liegeRelationshipKind = 'preserved-personal-service'
  args.allocation.existingTitleBindings[0].basis = '기존 인적 봉사 관계와 영토 작위 상위를 분리한다'
  const result = projectOpeningFeudalAllocation(args)
  assert.equal(result.holdings[0].directLiegePersonId, 'K002')
  assert.equal(result.holdings[0].liegeRelationshipKind, 'preserved-personal-service')
})

test('political control cannot be silently reassigned by a personal grant', () => {
  throws(args => {
    args.control.assignments[0].authority = { kind: 'state', stateId: 'S03', name: '다른 왕국' }
  }, 'E_TITLE_CONTROL_REALM:title:kingdom-han')
  throws(args => {
    args.outside.islands[0].components[0].authority = { kind: 'state', stateId: 'S03', name: '다른 왕국' }
  }, 'E_GRANT_CONTROL_REALM:holding:fixture-ganghwa')
})

test('happy fixture passes and merges the ledger with bindings, titles, grants, and counts', () => {
  const args = fixture()
  const before = structuredClone(args)
  const result = projectOpeningFeudalAllocation(args)
  assert.deepEqual(args, before)
  assert.equal(result.schema, 'confirmed-person-holdings.v1')
  assert.equal(result.openingYear, 2126)
  assert.deepEqual(result.summary, {
    existingHoldings: 1, newGrants: 3, holdings: 4, titles: 4, existingTitleBindings: 1,
    heldSeoulRegions: 2, heldOutsideUnits: 2, heldComponents: 1, unassignedComponents: 1,
    coveredEntitlements: 5,
  })
  assert.equal(result.holdings.length, 4)
  // 봉신 작위 보유자(K002)의 직영지 주군은 부모 왕작 보유자(K001)다.
  assert.equal(result.holdings[1].holderPersonId, 'K002')
  assert.equal(result.holdings[1].directLiegePersonId, 'K001')
  const bound = result.holdings.find(row => row.id === 'holding:fixture-ex1')
  assert.equal(bound.titleId, 'title:duchy-royal')
  const { titleId, ...unannotated } = bound
  assert.equal(titleId, 'title:duchy-royal')
  assert.deepEqual(unannotated, existing.holdings[0])
  assert.deepEqual(result.holdings.slice(1), grants)
  assert.deepEqual(result.titles, titles)
  assert.deepEqual(result.openingDispositions, existing.openingDispositions)
  assert.deepEqual(result.polities, existing.polities)
  assert.deepEqual(result.retinue, existing.retinue)
})

test('grant admin refs overlap nothing: not existing rights, not other new grants, not duplicate ids', () => {
  throws(args => {
    args.allocation.grants[1].adminRefs[0] = { id: 'region:1111053000', name: '신문로1가동' }
  }, 'E_GRANT_ADMINREF_OVERLAP:holding:fixture-royal|region:1111053000')
  throws(args => {
    args.existing.holdings.push(structuredClone(args.existing.holdings[0]))
  }, 'E_GRANT_ADMINREF_OVERLAP:holding:fixture-ex1|region:1111053000')
  throws(args => { args.allocation.grants[1].id = 'holding:fixture-jemulpo' }, 'E_HOLDING_DUPLICATE:holding:fixture-jemulpo')
})

test('title parent cycles are rejected before rank checks', () => {
  throws(args => {
    const duchy = args.allocation.titles.find(row => row.id === 'title:duchy-jemulpo')
    const barony = args.allocation.titles.find(row => row.id === 'title:barony-jemulpo')
    duchy.parentTitleId = 'title:barony-jemulpo'
    barony.parentTitleId = 'title:duchy-jemulpo'
  }, 'E_TITLE_CYCLE:title:duchy-jemulpo')
})

test('equal-rank subinfeudation is rejected', () => {
  throws(args => {
    const duchy = args.allocation.titles.find(row => row.id === 'title:duchy-royal')
    duchy.parentTitleId = 'title:duchy-jemulpo'
  }, 'E_TITLE_EQUAL_RANK:title:duchy-royal')
})

test('a king holding more than two direct sameholder duchies is rejected', () => {
  throws(args => {
    args.allocation.titles.push(
      { id: 'title:duchy-extra1', name: '왕실 공작령2', rank: 'duchy', holderPersonId: 'K001', stateId: 'S01',
        parentTitleId: 'title:kingdom-han', jurisdictionRefs: [], basis: 'fixture 과다 결정' },
      { id: 'title:duchy-extra2', name: '왕실 공작령3', rank: 'duchy', holderPersonId: 'K001', stateId: 'S01',
        parentTitleId: 'title:kingdom-han', jurisdictionRefs: [], basis: 'fixture 과다 결정' })
  }, 'E_TITLE_KING_DUCHY_CAP:title:kingdom-han')
})

test('explicitly landless people can receive neither titles nor grants nor bindings', () => {
  throws(args => { args.allocation.grants[0].holderPersonId = 'K003' }, 'E_LANDLESS_GRANT:K003')
  throws(args => { args.allocation.titles[1].holderPersonId = 'K003' }, 'E_LANDLESS_GRANT:K003')
})

test('unassigned island parts and uncontrolled admin units cannot be granted', () => {
  throws(args => { args.allocation.grants[2].componentRefs[0].componentIndex = 1 }, 'E_GRANT_UNASSIGNED:holding:fixture-ganghwa|2815551000#1')
  throws(args => {
    args.allocation.grants[2].componentRefs = []
    args.allocation.grants[2].adminRefs = [{ id: 'region:1111054000', name: '신문로2가동' }]
  }, 'E_GRANT_UNHELD:holding:fixture-ganghwa|region:1111054000')
})

test('every held entitlement must be covered exactly once by existing rights and new grants', () => {
  throws(args => { args.allocation.grants[0].adminRefs = [] }, 'E_COVERAGE_MISSING:region:1111051500')
  throws(args => { args.allocation.grants.splice(2, 1) }, 'E_COVERAGE_MISSING:2815551000#0')
})

test('grant admin refs must carry the exact geometry id and name', () => {
  throws(args => { args.allocation.grants[0].adminRefs[0].name = '잘못된 동 이름' },
    'E_GRANT_GEOMETRY:holding:fixture-jemulpo|region:1111051500')
  throws(args => { args.allocation.grants[0].adminRefs[0] = { id: 'region:9999999999', name: '청운효자동' } },
    'E_GRANT_GEOMETRY:holding:fixture-jemulpo|region:9999999999')
})

test('new grants belong to the title holder and liege is the parent title holder, null only when he holds the parent himself', () => {
  throws(args => { args.allocation.grants[2].directLiegePersonId = 'K001' }, 'E_GRANT_LIEGE:holding:fixture-ganghwa')
  throws(args => { args.allocation.grants[0].directLiegePersonId = null }, 'E_GRANT_LIEGE:holding:fixture-jemulpo')
  throws(args => { args.allocation.grants[1].directLiegePersonId = 'K001' }, 'E_GRANT_LIEGE:holding:fixture-royal')
  throws(args => { args.allocation.grants[2].titleId = 'title:duchy-jemulpo' }, 'E_GRANT_HOLDER_TITLE:holding:fixture-ganghwa')
  throws(args => { args.allocation.grants[2].formalTitleRank = 'duchy' }, 'E_GRANT_TITLE_RANK:holding:fixture-ganghwa')
})

test('bindings require the exact title holder and keep the existing direct liege untouched', () => {
  throws(args => { args.allocation.existingTitleBindings[0].titleId = 'title:duchy-jemulpo' }, 'E_BINDING_HOLDER:holding:fixture-ex1')
  const result = projectOpeningFeudalAllocation(fixture())
  const bound = result.holdings.find(row => row.id === 'holding:fixture-ex1')
  assert.equal(bound.directLiegePersonId, null)
  assert.equal(bound.titleId, 'title:duchy-royal')
})

test('jurisdiction refs follow current control and nest inside the parent jurisdiction', () => {
  throws(args => {
    args.allocation.titles[0].jurisdictionRefs.push('region:1111054000')
  }, 'E_TITLE_JURISDICTION_UNHELD:title:kingdom-han|region:1111054000')
  throws(args => {
    args.allocation.titles[0].jurisdictionRefs = args.allocation.titles[0].jurisdictionRefs.filter(ref => ref !== '2820069500')
    args.allocation.titles[1].jurisdictionRefs.push('2820069500')
  }, 'E_TITLE_JURISDICTION_SUBSET:title:duchy-jemulpo|2820069500')
})

test('realm membership allows self-state realms and otherwise requires hegemon membership', () => {
  const args = fixture()
  args.people.push({ id: 'K005', name: '중립 인물', state: 'S08' })
  args.allocation.titles.push(
    { id: 'title:duchy-neutral', name: '중립 공작령', rank: 'duchy', holderPersonId: 'K005', stateId: 'S08',
      parentTitleId: null, jurisdictionRefs: [], basis: 'fixture 중립 결정' })
  assert.doesNotThrow(() => projectOpeningFeudalAllocation(args))
  args.allocation.titles.at(-1).parentTitleId = 'title:kingdom-han'
  assert.throws(() => projectOpeningFeudalAllocation(args), /E_TITLE_PARENT_REALM:title:duchy-neutral/)
  throws(args => {
    args.people.push({ id: 'K005', name: '중립 인물', state: 'S08' })
    args.allocation.titles.push(
      { id: 'title:duchy-neutral', name: '중립 공작령', rank: 'duchy', holderPersonId: 'K005', stateId: 'S01',
        parentTitleId: 'title:kingdom-han', jurisdictionRefs: [], basis: 'fixture 중립 결정' })
  }, 'E_TITLE_MEMBERSHIP:title:duchy-neutral')
})

test('scale status stays authoritative in the passed input and HOLD rows forbid fabricated territorial scale', () => {
  throws(args => { args.allocation.grants[1].territorialScale = 'duchy' }, 'E_GRANT_SCALE_HOLD:holding:fixture-royal|2820069500')
  const confirmed = fixture()
  confirmed.scale.rows.find(row => row.adminId === '2820069500').status = 'projected'
  confirmed.allocation.grants[1].territorialScale = 'duchy'
  const result = projectOpeningFeudalAllocation(confirmed)
  assert.equal(result.holdings.find(row => row.id === 'holding:fixture-royal').territorialScale, 'duchy')
})
