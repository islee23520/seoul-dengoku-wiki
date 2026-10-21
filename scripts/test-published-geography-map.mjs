import { readSourceArchive } from './cast-sqlite/source-archive.mjs'
import { readCanonicalDocument } from './cast-sqlite/canonical-document.mjs'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'vitest'
import { buildAdminTerritorialScale } from './admin-territorial-scale.mjs'
import { validatePublishedGeographyMap } from './published-geography-map.mjs'
import { projectGeographicTitles, publicGeographicId, publicTerritorialScale } from '../src/components/geographicTitleMap.mjs'
import { publicJurisdictionReferences } from './generate-catalog.mjs'

const geographyBytes = readSourceArchive('lore/regions/seoul-electoral-titles.json', '372734e77019d0e544ded29f90e1b35b8a8c3a3cfff305c295c2bd83a6b64eef')
const geography = JSON.parse(geographyBytes)
const territorialScale = readCanonicalDocument('lore/offices/Offices-and-Ranks.json').data.territorialScale
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

test('known public jurisdiction fields share county IDs without changing internal rights or descriptor', () => {
  const id = geography.titles.find(title => title.rank === 'county').titleId
  const rows = [{ geographicScope: { countyTitleIds: [id], guRef: '11110' } }, { jurisdiction: { countyTitleIds: [id] } }]
  const before = structuredClone(rows)
  const result = publicJurisdictionReferences(rows)
  assert.equal(result[0].geographicScope.countyTitleIds[0], projected().titles.find(title => title.rank === 'county').id)
  assert.equal(result[1].jurisdiction.countyTitleIds[0], publicGeographicId(id, 'county'))
  assert.deepEqual(rows, before)
  const descriptor = publicTerritorialScale(territorialScale)
  assert.doesNotMatch(JSON.stringify(descriptor), /constituency|electoral|election|선거구/iu)
  assert.ok(territorialScale.geographicSource.path.includes('electoral'))
  assert.equal(descriptor.geographicSource.sha256, territorialScale.geographicSource.sha256)
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
    map => { map.titles.find(title => title.rank === 'county').id = geography.titles.find(title => title.rank === 'county').titleId },
  ]) {
    const map = projected()
    mutate(map)
    assert.throws(() => validatePublishedGeographyMap(map, geography, scale), /E_MAP_/)
  }
})
