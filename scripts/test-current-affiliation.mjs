import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { currentAffiliations, hegemonsForHolders, currentBasePoint, territoryLabel } from './current-affiliation.mjs'

const json = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const source = json('../lore/factions/Sixteen-States.json')
const contract = source.data.currentAffiliation
const historicalRows = source.content.find(block => block.anchor === 'table').rows.map(row => ({ id: row[0].ko, name: row[1].ko }))
const affiliations = currentAffiliations(contract, historicalRows)
const territory = json('../public/opening-territories.json')

test('current hegemons cover the sixteen immediate polities without inventing a union head', () => {
  const expected = { S02: ['S02', 'S03', 'S08', 'S11', 'S12', 'S13'], S06: ['S01', 'S05', 'S06', 'S07', 'S09', 'S14', 'S16'] }
  for (const [head, members] of Object.entries(expected)) {
    assert.deepEqual([...affiliations].filter(([, state]) => state.currentHegemon.stateId === head).map(([id]) => id).sort(), members)
  }
  assert.deepEqual([...affiliations].filter(([, state]) => state.currentHegemon.kind === 'union').map(([id]) => id).sort(), ['S04', 'S10', 'S15'])
  assert.equal(Object.hasOwn(affiliations.get('S04').currentHegemon, 'stateId'), false)
  assert.equal(hegemonsForHolders(['S04', 'S10', 'S15'], affiliations).length, 1)
  assert.deepEqual(hegemonsForHolders(['S08', 'S02', 'S06'], affiliations).map(item => item.stateId), ['S02', 'S06'])
})

test('invalid missing duplicate and unknown affiliation memberships are rejected', () => {
  for (const mutate of [
    draft => draft.hegemons[0].memberStateIds.pop(),
    draft => draft.hegemons[0].memberStateIds.push('S01'),
    draft => draft.hegemons[0].memberStateIds.push('S17'),
    draft => { draft.hegemons[2].stateId = 'S04' },
    draft => { draft.states[0].historicalName = 'wrong' },
  ]) {
    const draft = structuredClone(contract)
    mutate(draft)
    assert.throws(() => currentAffiliations(draft, historicalRows), /E_HEGEMON_|E_AFFILIATION_/)
  }
  assert.throws(() => hegemonsForHolders(['S00'], affiliations), /E_HEGEMON_HOLDER/)
})

test('facility based vassals can have no exclusive district while retaining historical capital holdings', () => {
  const state = territory.states.find(item => item.id === 'S08')
  const facility = territory.landmarks.find(item => item.id === 'n-seoul-tower')
  const base = currentBasePoint(contract.states.find(item => item.stateId === 'S08').currentBase, [], [facility])
  assert.deepEqual(territoryLabel([], base), { x: facility.x, y: facility.y })
  assert.equal(state.currentExclusiveDistrictCount, 0)
  assert.deepEqual([state.labelX, state.labelY], [facility.x, facility.y])
  assert.equal(state.capitalStationId, '흑석')
  const holding = json('../lore/relations/personal-holdings.json').holdings.find(item => item.stateId === 'S08' && item.stationRef)
  assert.equal(holding.stationRef.stationId, state.capitalStationId)
  assert.equal(holding.directLiegePersonId, null)
  assert.ok(territory.stations.find(item => item.id === state.capitalStationId).control.polityIds.includes('S08'))
  assert.throws(() => currentBasePoint(base, [], []), /E_CURRENT_BASE_NOT_FOUND/)
  assert.deepEqual(territoryLabel([{ x: 1, y: 2 }], base), { x: 1, y: 2 })
})

test('generated districts stations and segments retain immediate holders and project current hegemons', () => {
  assert.equal(territory.regions.length, 427)
  assert.equal(territory.stations.length, 314)
  assert.equal(territory.regions.filter(region => region.polities.includes('S08')).length, 36)
  assert.equal(territory.stations.filter(station => station.control.polityIds.includes('S08')).length, 23)
  for (const region of territory.regions) assert.deepEqual(region.currentHegemons, hegemonsForHolders(region.polities, affiliations))
  for (const { control } of [...territory.stations, ...territory.edges]) assert.deepEqual(control.currentHegemons, hegemonsForHolders(control.polityIds, affiliations))
  const adjacent = { 후암동: 'S07', 용산2가동: 'S07', 이태원1동: 'S07', 이태원2동: 'S07', 한남동: 'S07', 회현동: 'S06', 명동: 'S06', 필동: 'S06' }
  for (const [name, holder] of Object.entries(adjacent)) {
    const region = territory.regions.find(item => item.name === name)
    assert.deepEqual(region?.polities, [holder], name)
  }
  assert.equal(territory.landmarks.find(item => item.id === 'n-seoul-tower').holderId, 'S07')
})

test('historical chronology remains bound through historical name and issued people keep their state IDs', () => {
  const state = territory.states.find(item => item.id === 'S08')
  const historical = json('../lore/chronology/Century-Annals.json')
  const paragraphs = historical.content.filter(block => block.kind === 'paragraph').map(block => typeof block.text.ko === 'string' ? block.text.ko : block.text.ko.map(part => part.text).join(''))
  const expected = paragraphs.filter(text => text.includes(state.historicalName) || text.includes(state.name))
  for (const event of state.chronology) assert.ok(expected.includes(event.text))
  assert.ok(state.chronology.some(event => event.year === 2079))
  const people = json('../lore/name-pools/values-cast.json').people
  assert.equal(people.length, 1022)
  assert.equal(people.filter(person => person.state === 'S00').length, 4)
})
