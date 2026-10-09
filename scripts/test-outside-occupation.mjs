import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { projectOutsideOccupation } from './outside-occupation.mjs'

const json = path => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'))
const control = json('lore/regions/outside-control-2126.json')
const geometry = json('public/outside-admin-units.json')
const islands = json('lore/regions/outside-island-occupation.json')

test('mixed units project every island independently without assigning their whole boundary', () => {
  const projected = projectOutsideOccupation(control, geometry, islands)
  assert.deepEqual(projected, json('public/outside-control-2126.json'))
  const bukdo = projected.assignments.find(row => row.unitId === '2872031000')
  assert.equal(bukdo.authority, null)
  assert.equal(bukdo.status, 'partial')
  assert.deepEqual(bukdo.components.filter(part => part.authority).map(part => part.name).sort(), ['모도', '시도', '신도'])
  assert.equal(bukdo.components.find(part => part.name === '장봉도').authority, null)
  for (const row of projected.assignments.filter(row => row.components)) {
    assert.ok(!row.vassal && !row.station && !row.holderPersonId && !row.directLiegePersonId && !row.formalTitle)
    assert.deepEqual(row.components.map(part => part.path).join(' '), geometry.units.find(unit => unit.id === row.unitId).path)
    for (const part of row.components.filter(part => !part.authority)) {
      assert.equal(part.status, 'unassigned')
      assert.ok(!part.vassal && !part.station && !part.holderPersonId && !part.directLiegePersonId && !part.formalTitle)
    }
  }
})

test('whole unit takeover, missing components, stale geometry and unbridged grants are rejected', () => {
  for (const mutate of [
    (ledger, split) => { ledger.assignments.find(row => row.unitId === split.units[0].unitId).authority = { kind: 'state', stateId: 'S06', name: '대한민국정부' } },
    (_, split) => { split.units[0].components.pop() },
    (_, split) => { split.units[0].components[1].componentIndex = 0 },
    (_, split) => { split.units[0].pathSha256 = 'bad' },
    (_, split) => { split.units[0].components[0].authority = { kind: 'state', stateId: 'S06', name: '대한민국정부' } },
    (_, split) => { split.units[0].components[0].formalTitle = 'invented' },
    (ledger, split) => { ledger.assignments.find(row => row.unitId === split.units[0].unitId).vassal = 'invented' },
    (ledger, split) => { ledger.assignments.find(row => row.unitId === split.units[0].unitId).station = 'invented' },
    (_, split) => { split.units[0].components[0].vassal = 'invented' },
    (_, split) => { split.units[0].components[0].station = 'invented' },
    (_, split) => { split.units[0].components[0].holderPersonId = 'K001' },
    (_, split) => { split.units[0].components[0].directLiegePersonId = 'K001' },
  ]) {
    const ledger = structuredClone(control), split = structuredClone(islands)
    mutate(ledger, split)
    assert.throws(() => projectOutsideOccupation(ledger, geometry, split), /E_ISLAND_/u)
  }
})

test('government controls eligible Incheon, all Gimpo and all Gangwon without altering other units', () => {
  const projected = projectOutsideOccupation(control, geometry, islands)
  for (const unit of geometry.units.filter(unit => unit.province === '인천광역시' || unit.province === '강원특별자치도' || unit.district === '김포시')) {
    const row = projected.assignments.find(row => row.unitId === unit.id)
    if (row.components) assert.ok(row.components.every(part => part.authority === null || part.authority.stateId === 'S06'))
    else assert.equal(row.authority.stateId, 'S06', unit.name)
  }
})

test('state catalog applies no official religion only to the two government subordinates', () => {
  const map = json('public/opening-territories.json')
  for (const id of ['S05', 'S14']) {
    const state = map.states.find(state => state.id === id)
    assert.equal(state.currentHegemon.stateId, 'S06')
    assert.equal(state.religion, '없음')
    assert.equal(state.relation, '복속')
  }
  const church = map.states.find(state => state.id === 'S04')
  assert.equal(church.currentHegemon.kind, 'union')
  assert.equal(church.religion, '성전총회')
})
