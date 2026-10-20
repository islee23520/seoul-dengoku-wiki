import assert from 'node:assert/strict'
import { test } from 'vitest'
import { selectAtCoordinates } from '../src/components/mapCoordinateSelection.ts'
import { coordinateMap as map, outsideUnits as outside } from './fixtures/private-map-inputs.mjs'

const unproject = (x, y) => [
  map.projection.minEast + x / map.width * (map.projection.maxEast - map.projection.minEast),
  map.projection.maxNorth - y / map.height * (map.projection.maxNorth - map.projection.minNorth),
]

test('legacy dong and outside administrative polygons cannot select without geographic titles', () => {
  const [east, north] = unproject(20, 20)
  assert.equal(selectAtCoordinates(east, north, map, outside), null)
  const [outsideEast, outsideNorth] = unproject(80, 80)
  assert.equal(selectAtCoordinates(outsideEast, outsideNorth, map, outside), null)
  assert.equal(selectAtCoordinates(NaN, north, map, outside), null)
})
