import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { buildAdminTerritorialScale } from './admin-territorial-scale.mjs'
import { validatePublishedGeographyMap } from './published-geography-map.mjs'
import { projectGeographicTitles } from '../src/components/geographicTitleMap.mjs'

const geographyBytes = readFileSync(new URL('../lore/regions/seoul-electoral-titles.json', import.meta.url))
const geography = JSON.parse(geographyBytes)
const territorialScale = JSON.parse(readFileSync(new URL('../lore/offices/Offices-and-Ranks.json', import.meta.url))).data.territorialScale
const scale = buildAdminTerritorialScale({ geographyBytes, territorialScale })
const polygon = { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] }
const boundaries = { features: scale.titles.filter(title => title.rank === 'county').map(title => ({
  id: title.titleId, properties: { kind: 'county' }, geometry: polygon,
})) }
const projected = () => projectGeographicTitles(geography, boundaries, (x, y) => [x, y])

test('accepts the authentic browser projection with both independent editions', () => {
  const map = projected()
  assert.doesNotThrow(() => validatePublishedGeographyMap(map, geography, scale))
  assert.equal(map.titles.filter(title => title.rank === 'kingdom').length, 6)
  assert.equal(map.titles.flatMap(title => title.datedSlots).length, 426)
  assert.equal(map.titles.flatMap(title => title.currentSlots).length, 427)
})

test('rejects injected private fields, missing kingdom partition, and wrong current date', () => {
  for (const mutate of [
    map => { map.titles[0].historicalHoldingRefs = ['.omo/private/injected'] },
    map => { map.titles.find(title => title.rank === 'kingdom').countyIds = [] },
    map => { map.currentDate = '1900-01-01' },
    map => { map.titles.find(title => title.datedSlots.length).datedSlots[0].historicalHoldingRefs = ['private'] },
    map => { map.titles.find(title => title.datedSlots.length).datedSlots[0].holderPersonId = 'fabricated' },
    map => { map.spatialDate = '1900-01-01' },
    map => { map.titles.find(title => title.currentSlots.length).currentSlots[0].id = 'slot:other' },
  ]) {
    const map = projected()
    mutate(map)
    assert.throws(() => validatePublishedGeographyMap(map, geography, scale), /E_MAP_/)
  }
})
