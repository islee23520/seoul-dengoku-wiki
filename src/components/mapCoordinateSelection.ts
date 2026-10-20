import type { MapSelection } from './mapBridge'

type Projection = { minEast: number; maxEast: number; minNorth: number; maxNorth: number }
type Region = { id: string; path: string }
type OutsideUnit = { id: string; path: string }
type Geography = { titles: Array<Region & { rank: string }> }

const rings = (path: string) => [...path.matchAll(/M([^MZ]+)Z/gu)].map((match) =>
  [...('M' + match[1]).matchAll(/[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/gu)].map((point) => [Number(point[1]), Number(point[2])] as const))

const inside = (x: number, y: number, ring: readonly (readonly [number, number])[]) => {
  let result = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j]
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) result = !result
  }
  return result
}

export function selectAtCoordinates(east: number, north: number, map: { width: number; height: number; projection: Projection; regions: Region[]; geography?: Geography }, _outside: OutsideUnit[]): MapSelection | null {
  const { projection } = map
  if (!Number.isFinite(east) || !Number.isFinite(north) || east < projection.minEast || east > projection.maxEast ||
      north < projection.minNorth || north > projection.maxNorth) {
    return null
  }
  const x = (east - projection.minEast) / (projection.maxEast - projection.minEast) * map.width
  const y = (projection.maxNorth - north) / (projection.maxNorth - projection.minNorth) * map.height
  for (const region of map.geography?.titles.filter(title => title.rank === 'county') ?? []) {
    const polygons = rings(region.path)
    if (polygons.filter((ring) => inside(x, y, ring)).length % 2 === 1)
      return { kind: 'region', id: region.id }
  }
  return null
}
