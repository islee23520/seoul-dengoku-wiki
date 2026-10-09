import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
const json = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'))

test('approved Seoul sovereignty covers 427 unchanged dong including all five enclaves', () => {
  const map = json('public/opening-territories.json')
  assert.deepEqual(Object.fromEntries(['규격맹', '대한민국정부', '종교 연합', '중립'].map(name => [name, map.regions.filter(region => region.currentHegemons.some(hegemon => hegemon.name === name)).length])), { 규격맹: 142, 대한민국정부: 164, '종교 연합': 118, 중립: 3 })
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
