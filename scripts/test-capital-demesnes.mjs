import { readSourceArchive } from './cast-sqlite/source-archive.mjs'
import { readCanonicalDocument } from './cast-sqlite/canonical-document.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { JSDOM } from 'jsdom'
import { loadApprovedRightsHistory, projectCatalogCurrentHoldings, projectCatalogOutsideOccupation } from './person-detail-inputs.mjs'
import { buildAdminTerritorialScale } from './admin-territorial-scale.mjs'
import HoldingSelectionPanel from '../src/components/HoldingSelectionPanel.tsx'

const read = path => path.replace(/^\.\.\//u, '').startsWith('lore/') ? readCanonicalDocument(path.replace(/^\.\.\//u, '')) : JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))

test('the producer rejects both self and other registered lieges on capital station holdings', async () => {
  const holdings = read('../lore/relations/personal-holdings.json')
  const map = read('../public/opening-territories.json')
  const registry = read('../lore/name-pools/person-id-registry.json')
  const { historical } = await loadApprovedRightsHistory()
  const control = await projectCatalogOutsideOccupation(read('../lore/regions/outside-control-2126.json'),
    historical.outside, read('../lore/regions/outside-island-occupation.json'))
  const args = { people: read('../lore/name-pools/gurps-cast.json').people, seoul: map, control,
    outside: { ...historical.outside, islands: [] }, existing: holdings,
    allocation: read('../lore/relations/opening-feudal-allocation.json'),
    affiliation: read('../lore/factions/Sixteen-States.json').data.currentAffiliation,
    geographicScale: buildAdminTerritorialScale({
      geographyBytes: readSourceArchive('lore/regions/seoul-electoral-titles.json', '372734e77019d0e544ded29f90e1b35b8a8c3a3cfff305c295c2bd83a6b64eef'),
      territorialScale: read('../lore/offices/Offices-and-Ranks.json').data.territorialScale,
    }) }
  const context = { issuedById: new Map(registry.persons.map(person => [person.id, person])),
    territoryStates: map.states, openingTerritories: map, projectedLandmarks: map.landmarks,
    stationInteriors: read('../lore/regions/station-interiors.json'), seoulGraph: read('../snapshots/build-inputs/SeoulWorldGraph.json'),
    outsideGeometry: historical.outside, repoRoot: new URL('../', import.meta.url).pathname,
    geography: read('../lore/regions/seoul-electoral-titles.json') }
  const original = holdings.holdings.find(holding => holding.stationRef)
  assert.ok(original)
  await assert.doesNotReject(projectCatalogCurrentHoldings(args, context))
  for (const liege of [original.holderPersonId, 'K029']) {
    const mutated = structuredClone(args)
    mutated.existing.holdings.find(holding => holding.id === original.id).directLiegePersonId = liege
    await assert.rejects(projectCatalogCurrentHoldings(mutated, context), /E_CAPITAL_HOLDING/)
  }
})

test('an explicit unknown liege still fails closed rather than becoming a sovereign holding', () => {
  const original = read('../public/confirmed-person-holdings.json').holdings.find(holding => holding.stationRef)
  const holding = { ...original, directLiegePersonId: 'K-UNKNOWN' }
  const dom = new JSDOM(renderToStaticMarkup(createElement(MemoryRouter, null, createElement(HoldingSelectionPanel, { holding, openingYear: 2126, selectedRegionId: '', onSelectRegion() {} }))))
  try {
    assert.ok(dom.window.document.querySelector('[role="alert"]'))
    assert.equal(dom.window.document.querySelectorAll('a').length, 0)
  } finally { dom.window.close() }
})

test('every opening ruler holds the exact capital station without a fabricated liege or area grant', () => {
  const map = read('../public/opening-territories.json')
  const holdings = read('../public/confirmed-person-holdings.json').holdings
  const people = read('../lore/name-pools/person-id-registry.json').persons
  assert.equal(holdings.filter(holding => holding.stationRef).length, 15)
  for (const state of map.states.filter(state => state.id !== 'S08')) {
    const holding = holdings.find(holding => holding.stationRef && holding.stateId === state.id)
    assert.ok(holding, state.id)
    assert.equal(people.find(person => person.id === holding.holderPersonId).name, state.ruler)
    assert.equal(holding.stationRef.stationId, state.capitalStationId)
    assert.equal(holding.directLiegePersonId, null)
    assert.deepEqual(holding.adminRefs, [])
    assert.equal(holding.geometrySource, null)
    const dom = new JSDOM(renderToStaticMarkup(createElement(MemoryRouter, null, createElement(HoldingSelectionPanel, { holding, openingYear: 2126, selectedRegionId: '', onSelectRegion() {} }))))
    try {
      assert.equal(dom.window.document.querySelector('[role="alert"]'), null)
      assert.ok(dom.window.document.querySelector('a'))
    } finally { dom.window.close() }
  }
  assert.equal(map.states.find(state => state.id === 'S16').capitalStationId, '수서')
  assert.deepEqual(map.stations.find(station => station.id === '시청').control.polityIds, ['S06'])
  const regionHolding = holdings.find(holding => holding.id === 'holding:yangpyeong2')
  assert.equal(regionHolding.holderPersonId, 'K001')
  assert.deepEqual(regionHolding.adminRefs, [{ id: 'region:1156062000', name: '양평2동' }])
})
