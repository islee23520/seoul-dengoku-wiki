import { readSourceArchive } from './cast-sqlite/source-archive.mjs'
import { readCanonicalDocument } from './cast-sqlite/canonical-document.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { currentAffiliations, hegemonsForHolders, currentBasePoint, territoryLabel } from './current-affiliation.mjs'

const json = path => path.replace(/^\.\.\//u, '').startsWith('lore/') ? readCanonicalDocument(path.replace(/^\.\.\//u, '')) : JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const source = json('../lore/factions/Sixteen-States.json')
const approved = json('./fixtures/approved-political-partition.json')
const contract = source.data.currentAffiliation
const historicalRows = source.content.find(block => block.anchor === 'table').rows.map(row => ({ id: row[0].ko, name: row[1].ko }))
const affiliations = currentAffiliations(contract, historicalRows)
const territory = json('../public/opening-territories.json')
const stationCatalog = readCanonicalDocument('lore/places/Seoul-Station-Catalog.json')
const approvedStationNames = new Set(stationCatalog.content.filter(block => block.kind === 'table').flatMap(block => block.rows.map(row => row[0].ko)))
const canonicalStationIds = new Map(stationCatalog.data.station_aliases.flatMap(entry => [entry.id, ...entry.aliases].map(id => [id, entry.id])))
const approvedStationIds = new Set(JSON.parse(readSourceArchive('snapshots/build-inputs/SeoulWorldGraph.json', '46985afccc2d3f2b5e4e3152254d30bc023d0688d63745a951a9be0f6ebf097d')).stations.filter(station => approvedStationNames.has(station.nameKo)).map(station => canonicalStationIds.get(station.id) ?? station.id))

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

test('government base resolves the existing Cheong Wa Dae facility independently of its capital', () => {
  const base = affiliations.get('S06').currentBase
  assert.deepEqual(base, { kind: 'facility', landmarkId: 'cheong-wa-dae', name: '청와대' })
  const facility = territory.landmarks.find(item => item.id === base.landmarkId)
  assert.ok(facility)
  assert.deepEqual(currentBasePoint(base, [], [facility]), { ...base, x: facility.x, y: facility.y })
  assert.equal(territory.states.find(item => item.id === 'S06').capitalStationId, '광화문')
  assert.ok(contract.hegemons.every(hegemon => typeof hegemon.centerRegion === 'string' && hegemon.centerRegion.length > 0))
})

test('a facility base resolves without requiring surrounding district ownership', () => {
  const facility = { id: 'fixture-facility', x: 12, y: 34 }
  const base = currentBasePoint({ kind: 'facility', landmarkId: facility.id, name: 'Fixture' }, [], [facility])
  assert.deepEqual(territoryLabel([], base), { x: facility.x, y: facility.y })
  assert.throws(() => currentBasePoint(base, [], []), /E_CURRENT_BASE_NOT_FOUND/)
  assert.deepEqual(territoryLabel([{ x: 1, y: 2 }], base), { x: 1, y: 2 })
})

test('generated districts stations and segments retain immediate holders and project current hegemons', () => {
  assert.equal(territory.regions.length, 427)
  assert.deepEqual(new Set(territory.stations.map(station => station.id)), approvedStationIds)
  assert.equal(territory.stations.length, approvedStationIds.size)
  for (const state of territory.states) {
    assert.equal(state.currentExclusiveDistrictCount,
      territory.regions.filter(region => region.polities.includes(state.id)).length, state.id)
  }
  for (const region of territory.regions) { const enclave = ['1165052000','1165065100','1165051000','1165053000','1165053100'].some(id => region.id === 'region:' + id); assert.deepEqual(region.currentHegemons, enclave ? [{ kind: 'union', name: '종교 연합' }] : hegemonsForHolders(region.polities, affiliations)) }
  for (const { control } of [...territory.stations, ...territory.edges]) assert.deepEqual(control.currentHegemons, hegemonsForHolders(control.polityIds, affiliations))
  for (const landmark of territory.landmarks) {
    if (landmark.holderId) assert.ok(affiliations.has(landmark.holderId), landmark.id)
  }
})

test('chronology uses current names and preserves issued person identities', () => {
  const state = territory.states.find(item => item.id === 'S08')
  const historical = json('../lore/chronology/Century-Annals.json')
  const paragraphs = historical.content.filter(block => block.kind === 'paragraph').map(block => typeof block.text.ko === 'string' ? block.text.ko : block.text.ko.map(part => part.text).join(''))
  const expected = paragraphs.filter(text => text.includes(state.name))
  for (const event of state.chronology) assert.ok(expected.includes(event.text))
  assert.ok(state.chronology.some(event => event.year === 2079))
  const people = json('../lore/name-pools/values-cast.json').people
  const registry = readCanonicalDocument('lore/name-pools/person-id-registry.json').persons
  assert.equal(new Set(people.map(person => person.name)).size, people.length)
  assert.deepEqual(people.map(person => person.name).sort(), registry.map(person => person.name).sort())
})
