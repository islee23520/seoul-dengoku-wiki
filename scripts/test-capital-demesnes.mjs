import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { JSDOM } from 'jsdom'
import { runInNewContext } from 'node:vm'
import HoldingSelectionPanel from '../src/components/HoldingSelectionPanel.tsx'

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))

test('the producer rejects both self and other registered lieges on capital station holdings', () => {
  const source = readFileSync(new URL('./generate-catalog.mjs', import.meta.url), 'utf8')
  const start = source.indexOf('for (const holding of personalHoldings.holdings) {')
  const end = source.indexOf('  if (holding.facilityRef) {', start)
  assert.ok(start >= 0 && end > start)
  const producer = source.slice(start, end) + '\n}'
  const holdings = read('../lore/relations/personal-holdings.json')
  const map = read('../public/opening-territories.json')
  const registry = read('../lore/name-pools/person-id-registry.json')
  const original = holdings.holdings.find(holding => holding.stationRef)
  const context = (holding) => ({ personalHoldings: { holdings: [holding] }, territoryStates: map.states, openingTerritories: map, issuedById: new Map(registry.persons.map(person => [person.id, person])) })
  assert.doesNotThrow(() => runInNewContext(producer, context(original)))
  for (const liege of [original.holderPersonId, 'K029']) {
    assert.throws(() => runInNewContext(producer, context({ ...original, directLiegePersonId: liege })), /E_CAPITAL_HOLDING/)
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
  assert.equal(holdings.filter(holding => holding.stationRef).length, 16)
  for (const state of map.states) {
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
