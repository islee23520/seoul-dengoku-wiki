import { readSourceArchive } from './cast-sqlite/source-archive.mjs'
import { readCanonicalDocument } from './cast-sqlite/canonical-document.mjs'
// opening-feudal-allocation.v1 배분 검증 계약 테스트 — 작은 고정 fixture만 사용한다.
// 입력 점유·규모 상태는 전부 fixture가 넘겨주는 값이며 모듈이 개수를 알고 있지 않음을 함께 확인한다.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { projectHistoricalOpeningFeudalAllocation as projectOpeningFeudalAllocation,
  projectOpeningFeudalAllocation as projectCurrentOpeningFeudalAllocation } from './opening-feudal-allocation.mjs'
import { loadApprovedRightsHistory, projectCatalogCurrentHoldings, projectCatalogOutsideOccupation } from './generate-catalog.mjs'
import { buildAdminTerritorialScale } from './admin-territorial-scale.mjs'

const activeScale = () => buildAdminTerritorialScale({
  geographyBytes: readSourceArchive('lore/regions/seoul-electoral-titles.json', '372734e77019d0e544ded29f90e1b35b8a8c3a3cfff305c295c2bd83a6b64eef'),
  territorialScale: readCanonicalDocument('lore/offices/Offices-and-Ranks.json').data.territorialScale,
})

test('canonical allocation reproduces every published holding and person title', async () => {
  const json = path => path.replace(/^\.\.\//u, '').startsWith('lore/') ? readCanonicalDocument(path.replace(/^\.\.\//u, '')) : JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'))
  const seoul = json('public/opening-territories.json')
  const geometry = (await loadApprovedRightsHistory()).historical.outside
  const issued = json('lore/name-pools/gurps-cast.json').people
  const control = await projectCatalogOutsideOccupation(json('lore/regions/outside-control-2126.json'), geometry, json('lore/regions/outside-island-occupation.json'))
  const projected = await projectCatalogCurrentHoldings({
    allocation: json('lore/relations/opening-feudal-allocation.json'),
    existing: json('lore/relations/personal-holdings.json'),
    people: issued, seoul, outside: { ...geometry, islands: [] },
    control, affiliation: json('lore/factions/Sixteen-States.json').data.currentAffiliation,
    geographicScale: activeScale(),
  }, { issuedById: new Map(issued.map(person => [person.id, person])), territoryStates: seoul.states,
    openingTerritories: seoul, projectedLandmarks: seoul.landmarks, stationInteriors: json('lore/regions/station-interiors.json'),
    seoulGraph: json('snapshots/build-inputs/SeoulWorldGraph.json'), outsideGeometry: geometry,
    repoRoot: new URL('../', import.meta.url).pathname, geography: json('lore/regions/seoul-electoral-titles.json') })
  assert.equal(projected.schema, 'confirmed-person-holdings.v1')
  assert.equal(projected.holdings.length, json('lore/relations/personal-holdings.json').holdings.length + json('lore/relations/opening-feudal-allocation.json').grants.length)
  assert.ok(projected.holdings.every(holding => holding.kind !== 'direct-property' || holding.geographicTitleId === undefined))
  assert.ok(projected.titles.filter(title => title.kind === 'nonterritorial-political-title').every(title => title.geographicTitleId === undefined))
  assert.equal(projected.holdings.filter(row => row.kind === 'superior-jurisdiction').length, 5)
  assert.equal(projected.titles.some(row => row.kind === 'nonterritorial-political-title' && row.holderPersonId === 'K1008'), true)
})

test('authenticated historical Chungcheong duchy retains the original owner-directed three-city contract', async () => {
  const { historical } = await loadApprovedRightsHistory()
  const allocation = historical.allocation
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

test('sealed historical scale bytes reject tampering at the caller hash boundary', async () => {
  const scale = readFileSync(new URL('./historical-inputs/admin-territorial-scale.json', import.meta.url))
  const bytes = {
    approval: readFileSync(new URL('./approved-seoul-rights-transition.json', import.meta.url)),
    existing: readFileSync(new URL('./historical-inputs/personal-holdings.json', import.meta.url)),
    allocation: readFileSync(new URL('./historical-inputs/opening-feudal-allocation.json', import.meta.url)),
    control: readFileSync(new URL('./historical-inputs/outside-control-2126.json', import.meta.url)),
    islands: readFileSync(new URL('./historical-inputs/outside-island-occupation.json', import.meta.url)),
    geometry: readFileSync(new URL('./historical-inputs/outside-admin-units.json', import.meta.url)),
    scale: Buffer.concat([scale, Buffer.from(' ')]),
  }
  await assert.rejects(loadApprovedRightsHistory(bytes), /E_CATALOG_RIGHTS_HASH:scale/)
})

test('current accepts v2 and rejects v1 or legacy scale without inferring property grants', () => {
  const args = fixture()
  const historical = projectOpeningFeudalAllocation(args)
  const { scale: historicalScale, ...current } = args
  current.geographicScale = activeScale()
  assert.deepEqual(projectCurrentOpeningFeudalAllocation(current), historical)
  assert.throws(() => projectCurrentOpeningFeudalAllocation({ ...current, geographicScale: historicalScale }), /E_GEOGRAPHIC_SCALE_SCHEMA/)
  assert.throws(() => projectCurrentOpeningFeudalAllocation({ ...current, scale: historicalScale }), /E_GEOGRAPHIC_SCALE_SCHEMA/)
  assert.throws(() => projectCurrentOpeningFeudalAllocation({ ...current, geographicScale: { ...current.geographicScale, schema: 'admin-territorial-scale.v1' } }), /E_GEOGRAPHIC_SCALE_SCHEMA/)
  assert.ok(historical.holdings.every(row => row.geographicTitleId === undefined && row.slotId === undefined))
})

const heldAuthority = { kind: 'state', stateId: 'S01', name: '한강왕국' }
test('authenticated historical rights retain exact Daejeon neutrality and island component grants', async () => {
  const json = path => path.replace(/^\.\.\//u, '').startsWith('lore/') ? readCanonicalDocument(path.replace(/^\.\.\//u, '')) : JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'))
  const { historical } = await loadApprovedRightsHistory()
  const geometry = historical.outside
  const projected = projectOpeningFeudalAllocation({ ...historical,
    people: json('lore/name-pools/gurps-cast.json').people, seoul: json('public/opening-territories.json'),
    affiliation: json('lore/factions/Sixteen-States.json').data.currentAffiliation,
  })
  const control = historical.control
  assert.equal(control.assignments.length, geometry.units.length)
  assert.equal(new Set(control.assignments.map(row => row.unitId)).size, geometry.units.length)
  const daejeonUnits = geometry.units.filter(unit => unit.province === '대전광역시')
  assert.equal(daejeonUnits.length, 82)
  for (const unit of daejeonUnits) {
    const row = control.assignments.find(row => row.unitId === unit.id)
    assert.equal(row.authority.kind, 'neutral')
    assert.equal(row.authority.name, '대전')
    assert.ok(['K1008', 'K035', 'K038', 'K039'].includes(row.holderPersonId))
  }
  const daejeonRefs = new Set(projected.holdings.filter(row => row.stateId === 'polity:daejeon').flatMap(row => row.adminRefs.map(ref => ref.id)))
  assert.equal(daejeonRefs.size, daejeonUnits.length)
  for (const unit of daejeonUnits) assert.ok(daejeonRefs.has(unit.id))
  for (const row of control.assignments) {
    if (row.authority?.kind === 'neutral') assert.equal(geometry.units.find(unit => unit.id === row.unitId).province, '대전광역시')
    if (row.directLiegePersonId) assert.equal(row.directLiegePersonId, 'K1008')
  }
  const islands = control.assignments.filter(row => row.components)
  assert.equal(islands.length, 11)
  const personalRefs = new Set(projected.holdings.flatMap(row => row.adminRefs.map(ref => ref.id)))
  for (const unit of islands) {
    assert.equal(personalRefs.has(unit.unitId), false)
    for (const component of unit.components) {
      const grants = projected.holdings.filter(row => row.componentRefs?.some(ref => ref.unitId === unit.unitId && ref.componentIndex === component.componentIndex))
      assert.equal(grants.length, 1)
      assert.ok(['K151', 'K176', 'K355'].includes(grants[0].holderPersonId))
    }
  }
  assert.deepEqual(projected.polities.map(polity => [polity.id, polity.sovereignPersonId, polity.formalTitle, polity.formalTitleRank, polity.office, polity.territorialScale]),
    [['polity:daejeon', 'K1008', '대전선', '왕격', '대전 군주', 'kingdom']])
})

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

const nonowningFixture = () => {
  const args = fixture()
  const royalId = 'title:kingdom-daejeon'
  const stateId = 'polity:daejeon'
  const capabilityPackageId = 'proposal:registry-notice-and-objection-v1'
  const powers = ['receive-holding-change-notice', 'lodge-nonbinding-registry-objection']
  const rows = [
    ['dong', 'K1008', '11680', '강남구', ['갑', '을', '병']],
    ['yuseong', 'K1008', '11650', '서초구', ['갑', '을']],
    ['jung', 'K035', '11215', '광진구', ['갑', '을']],
    ['seo', 'K039', '11710', '송파구', ['갑', '을', '병']],
    ['daedeok', 'K038', '11740', '강동구', ['갑', '을']],
  ]
  args.people.push(...['K1008', 'K035', 'K039', 'K038'].map(id => ({ id, name: id, state: stateId })))
  args.nonowningRights = {
    schema: 'opening-nonowning-rights.v1', approvalRef: 'owner:fixture:approved-nonowning',
    proposalSha256: '1bc989e8a7cbf39723d8bd4dd5c83e54479e617e8161892fea62116bd72f0b7e',
    capabilityPackageId, politicalTitle: { id: royalId, holderPersonId: 'K1008', stateId },
    rights: rows.map(([suffix, holderPersonId, guRef, guName, constituencies]) => ({
      holdingId: 'holding:daejeon-' + suffix,
      titleId: 'proposal:superior-jurisdiction:seoul:daejeon-' + suffix,
      holderPersonId, stateId, personalLiegePersonId: holderPersonId === 'K1008' ? null : 'K1008',
      politicalParentTitleId: royalId,
      geographicScope: {
        duchyTitleId: 'geography:duchy:' + guRef, guRef,
        countyTitleIds: constituencies.map(part => 'geography:county:seoul-constituency:' + guName + part + '선거구'),
        geographicKingdomId: 'proposal:kingdom:seoul:06', geographicEmpireId: 'geography:empire:seoul',
      },
    })),
  }
  args.allocation.titles.push({
    id: royalId, kind: 'nonterritorial-political-title', name: '대전선', rank: 'kingdom',
    holderPersonId: 'K1008', stateId, basis: 'fixture approved independent political identity',
    politicalParentTitleId: null, personalLiegePersonId: null, directOwnership: false, jurisdictionRefs: [],
  })
  for (const row of args.nonowningRights.rights) {
    args.existing.holdings.push({
      id: row.holdingId, kind: 'superior-jurisdiction', name: { ko: row.holdingId },
      holderPersonId: row.holderPersonId, stateId, directLiegePersonId: row.personalLiegePersonId,
      liegeRelationshipKind: 'preserved-personal-service', titleId: row.titleId,
      geographicScope: structuredClone(row.geographicScope), territorialScale: 'duchy', formalTitleRank: null,
      adminRefs: [], geometrySource: null, directOwnership: false, capabilityPackageId, powers: [...powers],
    })
    args.allocation.titles.push({
      id: row.titleId, kind: 'superior-jurisdiction', name: row.titleId, rank: 'duchy',
      holderPersonId: row.holderPersonId, stateId, basis: 'fixture approved registry jurisdiction',
      directOwnership: false, geographicTitleId: row.geographicScope.duchyTitleId,
      geographicParentTitleId: row.geographicScope.geographicKingdomId,
      politicalParentTitleId: royalId, personalLiegePersonId: row.personalLiegePersonId,
    })
    args.allocation.existingTitleBindings.push({ holdingId: row.holdingId, titleId: row.titleId })
  }
  return args
}

const nonowningThrows = (mutate, message) => {
  const args = nonowningFixture()
  mutate(args)
  assert.throws(() => projectOpeningFeudalAllocation(args), { message })
}

test('approved five nonowning jurisdictions preserve direct ownership and independent royal identity', () => {
  const args = nonowningFixture()
  const before = structuredClone(args)
  const direct = projectOpeningFeudalAllocation(fixture())
  const result = projectOpeningFeudalAllocation(args)
  assert.deepEqual(args, before)
  assert.deepEqual(result.holdings.filter(row => row.kind !== 'superior-jurisdiction'), direct.holdings)
  assert.deepEqual(result.titles.filter(row => row.kind === undefined), direct.titles)
  assert.equal(result.summary.coveredEntitlements, direct.summary.coveredEntitlements)
  assert.equal(result.summary.newGrants, direct.summary.newGrants)
  assert.deepEqual(result.polities, direct.polities)
  assert.deepEqual(result.retinue, direct.retinue)
  assert.deepEqual(result.holdings.filter(row => row.kind === 'superior-jurisdiction'), args.existing.holdings.slice(1))
  const royal = result.titles.find(row => row.kind === 'nonterritorial-political-title')
  assert.equal(royal.politicalParentTitleId, null)
  assert.deepEqual(royal.jurisdictionRefs, [])
  assert.equal(royal.geographicTitleId, undefined)
  const rights = result.titles.filter(row => row.kind === 'superior-jurisdiction')
  assert.equal(rights.length, 5)
  assert.ok(rights.every(row => row.geographicParentTitleId !== row.politicalParentTitleId))
  assert.ok(rights.every(row => row.politicalParentTitleId === royal.id))
})

test('nonowning approval fixes holders, existing personal service, scope and exactly two powers', () => {
  const id = 'holding:daejeon-dong'
  nonowningThrows(args => { delete args.nonowningRights }, 'E_NONOWNING_APPROVAL:title:kingdom-daejeon')
  nonowningThrows(args => { args.existing.holdings[1].holderPersonId = 'K035' }, 'E_NONOWNING_HOLDER:' + id)
  nonowningThrows(args => { args.existing.holdings[1].directLiegePersonId = 'K001' }, 'E_NONOWNING_LIEGE:' + id)
  nonowningThrows(args => { args.existing.holdings[1].geographicScope.guRef = '30110' }, 'E_NONOWNING_GEOGRAPHY:' + id)
  nonowningThrows(args => { args.existing.holdings[1].geographicScope.countyTitleIds.push('geography:county:seoul-constituency:종로구선거구') }, 'E_NONOWNING_GEOGRAPHY:' + id)
  nonowningThrows(args => { args.nonowningRights.rights[0].geographicScope.guRef = '30110' }, 'E_NONOWNING_GEOGRAPHY:' + id)
  for (const power of ['tax-or-rent', 'judicial-authority', 'military-command-or-levy', 'station-or-facility-occupation', 'personal-vassalage', 'veto-or-compulsory-disclosure']) {
    nonowningThrows(args => { args.existing.holdings[1].powers.push(power) }, 'E_NONOWNING_POWERS:' + id)
  }
  nonowningThrows(args => { args.existing.holdings[1].powers.pop() }, 'E_NONOWNING_POWERS:' + id)
  nonowningThrows(args => { args.existing.holdings[1].powers[1] = args.existing.holdings[1].powers[0] }, 'E_NONOWNING_POWERS:' + id)
  nonowningThrows(args => { args.existing.holdings[1].capabilityPackageId = 'other' }, 'E_NONOWNING_POWERS:' + id)
  nonowningThrows(args => { args.existing.holdings[1].taxAuthority = true }, 'E_NONOWNING_FIELD:' + id)
})

test('nonowning records cannot aggregate property or satisfy missing direct coverage', () => {
  const id = 'holding:daejeon-dong'
  nonowningThrows(args => { args.existing.holdings[1].adminRefs = args.allocation.grants[0].adminRefs }, 'E_NONOWNING_OWNERSHIP:' + id)
  nonowningThrows(args => { args.existing.holdings[1].componentRefs = args.allocation.grants[2].componentRefs }, 'E_NONOWNING_OWNERSHIP:' + id)
  nonowningThrows(args => { args.existing.holdings[1].stationRef = { stationId: 'sinmun' } }, 'E_NONOWNING_OWNERSHIP:' + id)
  nonowningThrows(args => { args.existing.holdings[1].directOwnership = true }, 'E_NONOWNING_OWNERSHIP:' + id)
  nonowningThrows(args => { args.allocation.grants[0].adminRefs = [] }, 'E_COVERAGE_MISSING:region:1111051500')
  nonowningThrows(args => { args.existing.holdings.push(structuredClone(args.existing.holdings[1])) }, 'E_HOLDING_DUPLICATE:' + id)
  nonowningThrows(args => { args.allocation.grants.push(args.existing.holdings.pop()) }, 'E_NONOWNING_GRANT:holding:daejeon-daedeok')
})

test('geographic and political parents never create ownership or new vassalage', () => {
  const id = 'proposal:superior-jurisdiction:seoul:daejeon-dong'
  nonowningThrows(args => { args.allocation.titles[5].politicalParentTitleId = 'proposal:kingdom:seoul:06' }, 'E_NONOWNING_PARENT:' + id)
  nonowningThrows(args => { args.allocation.titles[5].geographicParentTitleId = 'title:kingdom-daejeon' }, 'E_NONOWNING_GEOGRAPHY:' + id)
  nonowningThrows(args => { args.allocation.titles[5].parentTitleId = 'title:kingdom-han' }, 'E_NONOWNING_PARENT:' + id)
  nonowningThrows(args => { args.allocation.titles[5].personalLiegePersonId = 'K001' }, 'E_NONOWNING_LIEGE:' + id)
  nonowningThrows(args => { args.allocation.titles[5].directLiegePersonId = 'K001' }, 'E_NONOWNING_FIELD:' + id)
  nonowningThrows(args => { args.allocation.titles[4].politicalParentTitleId = 'title:kingdom-han' }, 'E_NONOWNING_PARENT:title:kingdom-daejeon')
  nonowningThrows(args => { args.allocation.titles[4].jurisdictionRefs = ['region:1111051500'] }, 'E_NONOWNING_OWNERSHIP:title:kingdom-daejeon')
  nonowningThrows(args => { args.allocation.titles[1].parentTitleId = 'title:kingdom-daejeon' }, 'E_TITLE_PARENT_KIND:title:duchy-jemulpo')
  nonowningThrows(args => { args.allocation.grants[0].titleId = id }, 'E_GRANT_TITLE_KIND:holding:fixture-jemulpo')
  nonowningThrows(args => { args.allocation.existingTitleBindings[0].titleId = id }, 'E_BINDING_KIND:holding:fixture-ex1')
  nonowningThrows(args => { args.allocation.titles.splice(4, 1) }, 'E_NONOWNING_PARENT:' + id)
})

test('legacy and explicit direct-property fixtures keep the same strict checks', () => {
  const args = fixture()
  for (const row of [...args.existing.holdings, ...args.allocation.titles, ...args.allocation.grants]) row.kind = 'direct-property'
  assert.equal(projectOpeningFeudalAllocation(args).summary.coveredEntitlements, 5)
  args.allocation.grants[0].directLiegePersonId = null
  assert.throws(() => projectOpeningFeudalAllocation(args), { message: 'E_GRANT_LIEGE:holding:fixture-jemulpo' })
  nonowningThrows(args => { args.allocation.grants[0].adminRefs = args.existing.holdings[0].adminRefs }, 'E_GRANT_ADMINREF_OVERLAP:holding:fixture-jemulpo|region:1111053000')
  nonowningThrows(args => { args.allocation.grants[2].directLiegePersonId = 'K1008' }, 'E_GRANT_LIEGE:holding:fixture-ganghwa')
  nonowningThrows(args => { args.allocation.titles[1].kind = 'unknown' }, 'E_RIGHT_KIND:title:duchy-jemulpo')
  nonowningThrows(args => { delete args.existing.holdings[1].kind }, 'E_RIGHT_KIND:holding:daejeon-dong')
})
