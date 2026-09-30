import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { selectAtCoordinates } from '../src/components/mapCoordinateSelection.ts'

const map = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
const outside = JSON.parse(await readFile(new URL('../public/outside-admin-units.json', import.meta.url), 'utf8')).units
const unproject = (x, y) => [
  map.projection.minEast + x / map.width * (map.projection.maxEast - map.projection.minEast),
  map.projection.maxNorth - y / map.height * (map.projection.maxNorth - map.projection.minNorth),
]

test('resolves authored Seoul region and outside administrative unit from projected click', () => {
  const region = map.regions.find((item) => item.id === 'region:1111051500')
  const [east, north] = unproject(586, 418)
  assert.deepEqual(selectAtCoordinates(east, north, map, outside), { kind: 'region', id: region.id })
  const unit = outside.find((item) => item.id === '4111156000')
  const [outsideEast, outsideNorth] = unproject(660, 1380)
  assert.deepEqual(selectAtCoordinates(outsideEast, outsideNorth, map, outside), { kind: 'outside-unit', id: unit.id })
  assert.equal(selectAtCoordinates(NaN, north, map, outside), null)
})
