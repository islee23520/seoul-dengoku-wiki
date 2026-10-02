import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))

test('Saetgang concourse holding preserves the exact facility and direct liege without geographic grants', () => {
  const ledger = read('../lore/relations/personal-holdings.json')
  const holding = ledger.holdings.find(row => row.holderPersonId === 'K233')
  assert.equal(ledger.holdings.length, 2)
  assert.deepEqual(holding, {
    id: 'holding:saetgang-concourse', name: { ko: '샛강 대합실' },
    holderPersonId: 'K233', directLiegePersonId: 'K222', stateId: 'S09',
    facilityRef: { sourcePath: 'lore/regions/station-interiors.json', stationName: '샛강',
      siteSourcePath: 'lore/regions/content/11560.json', siteAnchor: 'osm:node:8401534578', layerId: 'concourse' },
    adminRefs: [], geometrySource: null, territorialScale: null, formalTitleRank: null,
  })
  const stations = read('../lore/regions/station-interiors.json').stations.filter(row => row.name === holding.facilityRef.stationName)
  assert.equal(stations.length, 1)
  const station = stations[0]
  const sites = read('../lore/regions/content/11560.json').regions.flatMap(row => row.content.buildings).filter(row => row.anchor_ref === holding.facilityRef.siteAnchor)
  assert.equal(sites.length, 1)
  assert.equal(sites[0].name, holding.facilityRef.stationName)
  assert.equal(station.observed_levels, null)
  assert.equal(station.layers.find(row => row.id === holding.facilityRef.layerId).wiki_layer, '역사 대합실')
  const detail = read('../public/person-details/person-0234.json')
  assert.equal(detail.gurps.id, 'K233')
  assert.equal(detail.directLiege.personId, 'K222')
  assert.deepEqual(detail.confirmedHoldings, [holding])
  assert.deepEqual(read('../public/confirmed-person-holdings.json'), ledger)
})

test('confirmed Yangcheon holding joins exact admin geometry and stays separate from proposal territory', () => {
  const ledger = read('../lore/relations/personal-holdings.json')
  const projected = read('../public/confirmed-person-holdings.json')
  const map = read('../public/opening-territories.json')
  const source = read('../lore/name-pools/gurps-cast.json').people
  const holding = ledger.holdings.find(row => row.id === 'holding:yangcheon')
  assert.deepEqual(projected, ledger)
  assert.equal(holding.holderPersonId, 'K002')
  assert.equal(holding.directLiegePersonId, 'K001')
  const expected = map.regions.filter(row => row.district === '양천구').map(row => ({ id: row.id, name: row.name }))
  assert.equal(expected.length, 18)
  assert.deepEqual(holding.adminRefs, expected)
  for (const person of source) {
    const detail = read('../public/person-details/' + person.url.split('/').at(-1) + '.json')
    assert.deepEqual(detail.territory, person.territory)
    assert.deepEqual(detail.confirmedHoldings, ledger.holdings.filter(row => row.holderPersonId === person.id))
  }
  const edges = read('../lore/relations/relations.json').ownerLieges.edges
  assert.equal(edges.length, 8)
  for (const edge of edges) {
    const person = source.find(row => row.id === edge.personId)
    const detail = read('../public/person-details/' + person.url.split('/').at(-1) + '.json')
    assert.equal(detail.directLiege.personId, edge.liegePersonId)
    assert.equal(detail.directLiege.relationKind, edge.relationKind)
    assert.equal(detail.directLiege.ownerTerm, edge.ownerTerm)
    assert.deepEqual(detail.confirmedHoldings, ledger.holdings.filter(row => row.holderPersonId === edge.personId))
  }
})
