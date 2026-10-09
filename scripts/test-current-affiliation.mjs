import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { currentAffiliations, hegemonsForHolders, currentBasePoint, territoryLabel } from './current-affiliation.mjs'

const json = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const source = json('../lore/factions/Sixteen-States.json')
const approved = json('./fixtures/approved-political-partition.json')
const contract = source.data.currentAffiliation
const historicalRows = source.content.find(block => block.anchor === 'table').rows.map(row => ({ id: row[0].ko, name: row[1].ko }))
const affiliations = currentAffiliations(contract, historicalRows)
const territory = json('../public/opening-territories.json')

test('current hegemons cover the sixteen immediate polities without inventing a union head', () => {
  const expected = Object.fromEntries(contract.hegemons.filter(head => head.kind === 'state').map(head => [head.stateId, approved.approvedStateMembership[head.name]]))
  for (const [head, members] of Object.entries(expected)) {
    assert.deepEqual([...affiliations].filter(([, state]) => state.currentHegemon.stateId === head).map(([id]) => id).sort(), members)
  }
  assert.deepEqual([...affiliations].filter(([, state]) => state.currentHegemon.kind === 'union').map(([id]) => id).sort(), approved.approvedStateMembership['종교 연합'])
  assert.equal(Object.hasOwn(affiliations.get('S04').currentHegemon, 'stateId'), false)
  assert.equal(hegemonsForHolders(['S04', 'S05', 'S14', 'S15', 'S16'], affiliations).length, 2)
  const rows = source.content.find(block => block.anchor === 'table-gov-relations').rows
  for (const name of ['동방사', '아관사']) assert.equal(rows.find(row => row[0].ko === name)[1].ko, '복속')
  assert.deepEqual(affiliations.get('S08').currentHegemon, { kind: 'neutral', name: '중립' })
  assert.deepEqual(hegemonsForHolders(['S08', 'S02', 'S06'], affiliations).map(item => item.kind), ['neutral', 'state', 'state'])
})

test('invalid missing duplicate and unknown affiliation memberships are rejected', () => {
  for (const mutate of [
    draft => draft.hegemons[0].memberStateIds.pop(),
    draft => draft.hegemons[0].memberStateIds.push('S02'),
    draft => draft.hegemons[0].memberStateIds.push('S17'),
    draft => { draft.hegemons[2].stateId = 'S04' },
    draft => { draft.states[0].currentName = 'wrong' },
  ]) {
    const draft = structuredClone(contract)
    mutate(draft)
    assert.throws(() => currentAffiliations(draft, historicalRows), /E_HEGEMON_|E_AFFILIATION_/)
  }
  assert.throws(() => hegemonsForHolders(['S00'], affiliations), /E_HEGEMON_HOLDER/)
})

test('neutral Namsan bureau holds three districts and its tower separately from its capital', () => {
  const state = territory.states.find(item => item.id === 'S08')
  const facility = territory.landmarks.find(item => item.id === 'n-seoul-tower')
  const base = currentBasePoint(contract.states.find(item => item.stateId === 'S08').currentBase, [], [facility])
  assert.deepEqual(territoryLabel([], base), { x: facility.x, y: facility.y })
  assert.equal(state.currentExclusiveDistrictCount, 3)
  assert.equal(state.capitalStationId, '녹사평')
  const holding = json('../lore/relations/personal-holdings.json').holdings.find(item => item.stateId === 'S08' && item.landmarkRef)
  assert.equal(holding.landmarkRef.landmarkId, facility.id)
  assert.equal(holding.directLiegePersonId, null)
  assert.ok(territory.stations.find(item => item.id === state.capitalStationId).control.polityIds.includes('S08'))
  assert.throws(() => currentBasePoint(base, [], []), /E_CURRENT_BASE_NOT_FOUND/)
  assert.deepEqual(territoryLabel([{ x: 1, y: 2 }], base), { x: 1, y: 2 })
})

test('generated districts stations and segments retain immediate holders and project current hegemons', () => {
  assert.equal(territory.regions.length, 427)
  assert.equal(territory.stations.length, 314)
  assert.equal(territory.regions.filter(region => region.polities.includes('S08')).length, 3)
  assert.equal(territory.stations.filter(station => station.control.polityIds.includes('S08')).length, 1)
  for (const region of territory.regions) { const enclave = ['1165052000','1165065100','1165051000','1165053000','1165053100'].some(id => region.id === 'region:' + id); assert.deepEqual(region.currentHegemons, enclave ? [{ kind: 'union', name: '종교 연합' }] : hegemonsForHolders(region.polities, affiliations)) }
  for (const { control } of [...territory.stations, ...territory.edges]) assert.deepEqual(control.currentHegemons, hegemonsForHolders(control.polityIds, affiliations))
  const adjacent = { 후암동: 'S08', 용산2가동: 'S08', 이태원1동: 'S07', 이태원2동: 'S08', 한남동: 'S07', 회현동: 'S06', 명동: 'S06', 필동: 'S06' }
  for (const [name, holder] of Object.entries(adjacent)) {
    const region = territory.regions.find(item => item.name === name)
    assert.deepEqual(region?.polities, [holder], name)
  }
  assert.equal(territory.landmarks.find(item => item.id === 'n-seoul-tower').holderId, 'S08')
})

test('chronology uses current names and preserves issued person identities', () => {
  const state = territory.states.find(item => item.id === 'S08')
  const historical = json('../lore/chronology/Century-Annals.json')
  const paragraphs = historical.content.filter(block => block.kind === 'paragraph').map(block => typeof block.text.ko === 'string' ? block.text.ko : block.text.ko.map(part => part.text).join(''))
  const expected = paragraphs.filter(text => text.includes(state.name))
  for (const event of state.chronology) assert.ok(expected.includes(event.text))
  assert.ok(state.chronology.some(event => event.year === 2079))
  const people = json('../lore/name-pools/values-cast.json').people
  assert.equal(people.length, 1022)
  assert.equal(people.filter(person => person.state === 'S00').length, 4)
})
