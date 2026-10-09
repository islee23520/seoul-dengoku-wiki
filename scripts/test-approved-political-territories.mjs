import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
const approved = JSON.parse(readFileSync(new URL('./fixtures/approved-political-partition.json', import.meta.url), 'utf8'))
const json = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'))

test('approved Seoul sovereignty covers 427 unchanged dong including all five enclaves', () => {
  const map = json('public/opening-territories.json')
  const expectedHolders = approved.seoulBaseline.map(row => [row.id, approved.namsan.includes(row.id) ? 'S08' : row.holder === 'S08' ? 'S02' : row.holder]).sort()
  assert.equal(new Set(map.regions.map(row => row.id)).size, 427)
  assert.deepEqual(map.regions.map(row => [row.id, row.polities[0]]).sort(), expectedHolders)
  assert.ok(map.regions.every(row => row.polities.length === 1 && row.currentHegemons.length === 1))
  assert.deepEqual(Object.fromEntries(['규격맹', '대한민국정부', '종교 연합', '중립'].map(name => [name, map.regions.filter(region => region.currentHegemons.some(hegemon => hegemon.name === name)).length])), { 규격맹: 142, 대한민국정부: 198, '종교 연합': 84, 중립: 3 })
  for (const code of ['1165052000','1165065100','1165051000','1165053000','1165053100']) assert.deepEqual(map.regions.find(region => region.id === 'region:' + code).currentHegemons, [{kind:'union',name:'종교 연합'}])
  assert.deepEqual(map.regions.filter(region => region.polities.includes('S08')).map(region => region.id).sort(), ['1117051000','1117052000','1117066000'].map(code => 'region:' + code))
  assert.equal(map.landmarks.find(site => site.id === 'n-seoul-tower').holderId, 'S08')
})

test('Daejeon grants cover all 82 units once with exact direct demesne and vassals', () => {
  const ledger = json('lore/relations/personal-holdings.json')
  const geometry = json('public/outside-admin-units.json')
  const control = json('public/outside-control-2126.json')
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
  const detail = json('public/person-details/person-1008.json')
  assert.deepEqual(detail.retinueGroups, ledger.retinueGroups)
  assert.deepEqual(detail.sovereignTitle, sovereign)
})


test('outside authority matches the complete owner-approved city partition rather than matching totals', () => {
  const units = json('public/outside-admin-units.json').units
  const assignments = json('public/outside-control-2126.json').assignments
  const cities = Object.values(approved.gyeonggiCities).flat()
  const islandUnits = new Set(json(approved.source.correction.islandSource).units.map(unit => unit.unitId))
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

test('external organizations retain identity while approved city corrections change their authority', () => {
  const map = json('public/opening-territories.json')
  const approvedMembership = new Map(Object.entries(approved.approvedStateMembership).flatMap(([name, ids]) => ids.map(id => [id, name])))
  assert.equal(approved.priorVassals.length, 13)
  assert.ok(approved.priorVassals.every(row => approvedMembership.has(row.suzerain)))
  assert.deepEqual(map.vassals.map(row => row.name).sort(), approved.priorVassals.map(row => row.name).sort())
  assert.equal(new Set(approved.conflictingExternalLinks).size, approved.conflictingExternalLinks.length)
  assert.deepEqual(map.vassals.map(row => [row.name, row.authorityName, row.suzerain]).sort(), approved.externalDestinations.map(row => [row.name, row.authority, row.suzerain]).sort())
  const changed = approved.priorVassals.filter(previous => {
    const current = map.vassals.find(row => row.name === previous.name)
    assert.ok(current, previous.name)
    return approvedMembership.get(previous.suzerain) !== current.authorityName
  }).map(row => row.name).sort()
  assert.deepEqual(changed, [...approved.conflictingExternalLinks].sort())
})
