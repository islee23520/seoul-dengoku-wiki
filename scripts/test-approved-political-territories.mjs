import { readSourceArchive } from './cast-sqlite/source-archive.mjs'
import { readCanonicalDocument } from './cast-sqlite/canonical-document.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { authenticateNonowningRights, loadApprovedRightsHistory, projectCatalogCurrentHoldings, projectCatalogOutsideOccupation, projectPersonHoldings } from './generate-catalog.mjs'
import { projectHistoricalOpeningFeudalAllocation } from './opening-feudal-allocation.mjs'
import { buildAdminTerritorialScale } from './admin-territorial-scale.mjs'
import { loadCiaFacilityProjection } from './cia-facility-projection-input.mjs'
import { projectCiaFacilityHoldings } from './cia-facility-publication.mjs'
import { relative } from 'node:path'
const approved = JSON.parse(readFileSync(new URL('./fixtures/approved-political-partition.json', import.meta.url), 'utf8'))
const json = path => path.replace(/^\.\.\//u, '').startsWith('lore/') ? readCanonicalDocument(path.replace(/^\.\.\//u, '')) : JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'))

test('approved Seoul sovereignty preserves all dong and limits CIA control to the tower facility', () => {
  const map = json('public/opening-territories.json')
  const expectedHolders = approved.seoulBaseline.map(row => [row.id, approved.namsan.includes(row.id) ? undefined : row.holder === 'S08' ? 'S02' : row.holder]).sort()
  assert.equal(new Set(map.regions.map(row => row.id)).size, 427)
  assert.deepEqual(map.regions.map(row => [row.id, row.polities[0]]).sort(), expectedHolders)
  assert.ok(map.regions.every(row => row.polities.length === (approved.namsan.includes(row.id) ? 0 : 1)
    && row.currentHegemons.length === row.polities.length))
  assert.deepEqual(Object.fromEntries(['규격맹', '대한민국정부', '종교 연합', '중립'].map(name => [name, map.regions.filter(region => region.currentHegemons.some(hegemon => hegemon.name === name)).length])), { 규격맹: 142, 대한민국정부: 198, '종교 연합': 84, 중립: 0 })
  for (const code of ['1165052000','1165065100','1165051000','1165053000','1165053100']) assert.deepEqual(map.regions.find(region => region.id === 'region:' + code).currentHegemons, [{kind:'union',name:'종교 연합'}])
  assert.deepEqual(map.regions.filter(region => region.polities.includes('S08')), [])
  assert.deepEqual(map.regions.filter(region => !region.polities.length).map(region => region.id).sort(), ['1117051000','1117052000','1117066000'].map(code => 'region:' + code))
  assert.equal(map.landmarks.find(site => site.id === 'n-seoul-tower').holderId, 'S08')
})

test('authenticated historical Daejeon grants cover all 82 units once with exact direct demesne and vassals', async () => {
  const { historical } = await loadApprovedRightsHistory()
  const ledger = historical.existing
  const geometry = historical.outside
  const control = historical.control
  const holdings = ledger.holdings.filter(holding => holding.stateId === 'polity:daejeon')
  const expected = { 동구: ['K1008', null, 16], 유성구: ['K1008', null, 13], 중구: ['K035', 'K1008', 17], 서구: ['K039', 'K1008', 24], 대덕구: ['K038', 'K1008', 12] }
  assert.equal(holdings.length, 5)
  assert.equal(new Set(holdings.flatMap(holding => holding.adminRefs.map(ref => ref.id))).size, 82)
  for (const [district, [holder, liege, count]] of Object.entries(expected)) {
    const units = geometry.units.filter(unit => unit.province === '대전광역시' && unit.district === district)
    const holding = holdings.find(holding => holding.adminRefs.some(ref => ref.id === units[0].id))
    assert.deepEqual([holding.holderPersonId, holding.directLiegePersonId, holding.adminRefs.length], [holder, liege, count])
    assert.deepEqual(holding.adminRefs.map(ref => ref.id).sort(), units.map(unit => unit.id).sort())
    for (const unit of units) {
      const row = control.assignments.find(row => row.unitId === unit.id)
      assert.deepEqual([row.holderPersonId, row.directLiegePersonId, row.authority], [holder, liege, {kind:'neutral',name:'대전'}])
    }
  }
  const sovereign = ledger.polities.find(polity => polity.id === 'polity:daejeon')
  assert.deepEqual([sovereign.sovereignPersonId, sovereign.formalTitle, sovereign.formalTitleRank, sovereign.office], ['K1008','대전선','왕격','대전 군주'])
  const group = ledger.retinueGroups[0]
  assert.deepEqual([group.count, group.liegePersonId, group.holdingIds, group.formalTitle], [24, 'K1008', [], null])
  assert.deepEqual(group.duties, ['농업','지역 통신','보급','정비'])
  assert.equal(group.personhoodReview, 'individual')
  const current = json('lore/relations/personal-holdings.json')
  assert.deepEqual(current.retinueGroups, ledger.retinueGroups)
  const currentSovereign = current.polities.find(polity => polity.id === sovereign.id)
  assert.deepEqual(currentSovereign, { ...sovereign, territorialScale: null, directOwnership: false, politicalTitleId: 'title:kingdom-daejeon' })
})

test('approved current rights retain Seoul property and only limited nonowning Daejeon jurisdiction', async () => {
  const { historical } = await loadApprovedRightsHistory()
  const people = json('lore/name-pools/gurps-cast.json').people
  const seoul = json('public/opening-territories.json')
  const currentSeoul = structuredClone(seoul)
  // Historical replay retains its original three-dong jurisdiction. Apply the
  // later facility-only decision only after authenticating that predecessor.
  for (const region of seoul.regions.filter(row => approved.namsan.includes(row.id))) {
    region.polities = ['S08']
    region.currentHegemons = [{ kind: 'neutral', name: '중립' }]
  }
  const currentControl = json('lore/regions/outside-control-2126.json')
  const currentIslands = json('lore/regions/outside-island-occupation.json')
  const control = await projectCatalogOutsideOccupation(currentControl, historical.outside, currentIslands)
  assert.deepEqual(control.assignments, [])
  const args = { people, seoul, control, outside: { ...historical.outside, islands: [] },
    affiliation: json('lore/factions/Sixteen-States.json').data.currentAffiliation,
    existing: json('lore/relations/personal-holdings.json'), allocation: json('lore/relations/opening-feudal-allocation.json') }
  const context = { issuedById: new Map(people.map(person => [person.id, person])), territoryStates: seoul.states,
    openingTerritories: seoul, projectedLandmarks: seoul.landmarks, stationInteriors: json('lore/regions/station-interiors.json'),
    seoulGraph: json('snapshots/build-inputs/SeoulWorldGraph.json'), outsideGeometry: historical.outside,
    repoRoot: new URL('../', import.meta.url).pathname, geography: json('lore/regions/seoul-electoral-titles.json') }
  const original = projectHistoricalOpeningFeudalAllocation({ ...args, ...historical })
  assert.equal(original.summary.coveredEntitlements, 1939)
  const predecessor = await projectCatalogCurrentHoldings({ ...args, geographicScale: buildAdminTerritorialScale({
    geographyBytes: readSourceArchive('lore/regions/seoul-electoral-titles.json', '372734e77019d0e544ded29f90e1b35b8a8c3a3cfff305c295c2bd83a6b64eef'),
    territorialScale: json('lore/offices/Offices-and-Ranks.json').data.territorialScale,
  }) }, context)
  const root = new URL('../', import.meta.url).pathname
  const { correction } = await loadCiaFacilityProjection(root, path => readSourceArchive(relative(root, path)))
  const projected = projectCiaFacilityHoldings(predecessor, correction)
  assert.deepEqual([projected.summary.heldSeoulRegions, projected.summary.heldOutsideUnits, projected.summary.heldComponents,
    projected.summary.unassignedComponents, projected.summary.coveredEntitlements], [424, 0, 0, 0, 424])
  assert.equal(currentSeoul.regions.filter(row => row.polities.length).length, projected.summary.heldSeoulRegions)
  const historicalDirect = original.holdings.filter(row => !row.componentRefs?.length && row.adminRefs.every(ref => ref.id.startsWith('region:11')))
  const direct = historicalDirect.filter(row => row.id !== correction.retiredGrantId)
  assert.equal(historicalDirect.length, 51)
  assert.equal(direct.length, 50)
  assert.deepEqual(projected.holdings.filter(row => row.kind !== 'superior-jurisdiction'), direct)
  const approval = authenticateNonowningRights(readFileSync(new URL('./approved-daejeon-nonowning-rights.json', import.meta.url)))
  const jurisdictions = projected.holdings.filter(row => row.kind === 'superior-jurisdiction')
  assert.equal(jurisdictions.length, 5)
  for (const right of approval.contract.rights) {
    const holding = jurisdictions.find(row => row.id === right.holdingId)
    assert.deepEqual([holding.holderPersonId, holding.directLiegePersonId, holding.geographicScope],
      [right.holderPersonId, right.personalLiegePersonId, right.geographicScope])
    assert.deepEqual([holding.directOwnership, holding.adminRefs, holding.geometrySource, holding.capabilityPackageId, holding.powers],
      [false, [], null, 'proposal:registry-notice-and-objection-v1', ['receive-holding-change-notice', 'lodge-nonbinding-registry-objection']])
  }
  for (const person of people) {
    const view = projectPersonHoldings(projected, person.id, context.issuedById, people)
    assert.deepEqual(view.confirmedHoldings, direct.filter(row => row.holderPersonId === person.id))
    assert.ok((view.subordinateHoldings ?? []).every(row => row.kind !== 'superior-jurisdiction'))
  }
  const royal = projectPersonHoldings(projected, 'K1008', context.issuedById, people)
  assert.deepEqual(royal.confirmedHoldings, [])
  assert.equal(royal.subordinateHoldings, undefined)
  assert.equal(royal.superiorJurisdictions.length, 2)
  const revived = structuredClone(currentControl)
  revived.assignments.push(structuredClone(historical.control.assignments[0]))
  await assert.rejects(projectCatalogOutsideOccupation(revived, historical.outside, currentIslands), /E_OUTSIDE_RETIREMENT_CURRENT_CONTROL/)
  const unknown = { ...args, ...structuredClone(historical) }
  unknown.allocation.titles[0].jurisdictionRefs.push('region:unknown')
  assert.throws(() => projectHistoricalOpeningFeudalAllocation(unknown), /E_TITLE_JURISDICTION:/)
})

test('authenticated historical outside authority matches the complete owner-approved city partition rather than matching totals', async () => {
  const { historical } = await loadApprovedRightsHistory()
  const units = historical.outside.units
  const assignments = historical.control.assignments
  const cities = Object.values(approved.gyeonggiCities).flat()
  const islandUnits = new Set(historical.outside.islands.map(unit => unit.unitId))
  assert.equal(new Set(cities).size, 31)
  const expected = units.map(unit => {
    if (islandUnits.has(unit.id)) return [unit.id, null]
    if (unit.province !== '경기도') return [unit.id, approved.otherProvinces[unit.province]]
    const matches = Object.entries(approved.gyeonggiCities).filter(([, names]) => names.some(name => unit.district.startsWith(name)))
    assert.equal(matches.length, 1, unit.name)
    return [unit.id, matches[0][0]]
  }).sort()
  assert.deepEqual(assignments.map(row => [row.unitId, row.authority?.name ?? null]).sort(), expected)
  const representedCities = cities.filter(city => units.some(unit => unit.province === '경기도' && unit.district.startsWith(city)))
  assert.deepEqual(representedCities.sort(), cities.sort())
})

test('the exact baseline S08 region and station sets transfer completely to S02', () => {
  const map = json('public/opening-territories.json')
  assert.equal(approved.oldS08.regionIds.length, 36)
  assert.equal(approved.oldS08.stationIds.length, 23)
  assert.deepEqual(map.regions.filter(row => approved.oldS08.regionIds.includes(row.id)).map(row => [row.id, row.polities]).sort(), approved.oldS08.regionIds.map(id => [id, ['S02']]).sort())
  assert.deepEqual(map.stations.filter(row => approved.oldS08.stationIds.includes(row.id)).map(row => [row.id, row.control.polityIds]).sort(), approved.oldS08.stationIds.map(id => [id, ['S02']]).sort())
})

test('retired external markers preserve approved political identities without current property grants', async () => {
  const map = json('public/opening-territories.json')
  assert.deepEqual(map.vassals, [])
  const { historical, transition } = await loadApprovedRightsHistory()
  const allocation = json('lore/relations/opening-feudal-allocation.json')
  const retired = historical.allocation.titles.filter(title => transition.records.some(row =>
    row.set === 'titles' && row.oldId === title.id && row.disposition === 'retired-current'))
  assert.ok(retired.length > 0)
  assert.deepEqual(allocation.politicalIdentities, retired.map(title => ({
    id: title.id, kind: 'nonterritorial-political-identity', rank: title.rank,
    holderPersonId: title.holderPersonId, stateId: title.stateId,
    politicalParentTitleId: title.parentTitleId ?? null,
    personalLieges: historical.allocation.grants.filter(grant => grant.titleId === title.id)
      .map(grant => ({ holdingId: grant.id, directLiegePersonId: grant.directLiegePersonId })),
    directOwnership: false,
  })))
  assert.ok(allocation.grants.every(grant => !retired.some(title => title.id === grant.titleId)))
})
