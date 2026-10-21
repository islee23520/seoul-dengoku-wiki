import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { selectedSource, sourceSha256 } from './project-outside-admin-units.mjs'
import { readCanonicalDocument } from './cast-sqlite/canonical-document.mjs'
import { readSourceArchive } from './cast-sqlite/source-archive.mjs'

export const STATION_CATALOG_PATH = 'lore/places/Seoul-Station-Catalog.json'
export const STATION_BOUNDARY_PATH = 'data/geography/boundaries/admdongkor-20260701.geojson'
const STATION_ARCHIVE_PATH = 'snapshots/build-inputs/SeoulWorldGraph.json'
const stationArchiveSha256 = '46985afccc2d3f2b5e4e3152254d30bc023d0688d63745a951a9be0f6ebf097d'
const fail = (code, pointer) => { throw Object.assign(new Error(code + ':' + pointer), { code, path: pointer }) }

// The existing map ray-crossing rule, applied to unsimplified CRS84 rings.
// Return boundary separately so outer and hole boundaries are both covered.
function ringPosition([x, y], ring) {
  let inside = false
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const [ax, ay] = ring[previous]
    const [bx, by] = ring[index]
    const cross = (x - ax) * (by - ay) - (y - ay) * (bx - ax)
    if (Math.abs(cross) < 1e-12 && x >= Math.min(ax, bx) && x <= Math.max(ax, bx)
      && y >= Math.min(ay, by) && y <= Math.max(ay, by)) return 0
    if ((by > y) !== (ay > y) && x < ((ax - bx) * (y - by)) / (ay - by) + bx) inside = !inside
  }
  return inside ? 1 : -1
}

function seoulBoundaryContains(boundaryBytes) {
  // Reuse the authenticated national-source hash, CRS and coverage contract.
  let source
  try { source = selectedSource(boundaryBytes) }
  catch { fail('E_STATION_BOUNDARY', STATION_BOUNDARY_PATH) }
  const polygons = source.features.filter(feature => feature.properties.sido === '11'
    && feature.properties.sidonm === '서울특별시').flatMap(({ geometry }) => {
    if (!['Polygon', 'MultiPolygon'].includes(geometry.type)) fail('E_STATION_BOUNDARY', STATION_BOUNDARY_PATH)
    return geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  }).map(rings => {
    const xs = rings[0].map(point => point[0]), ys = rings[0].map(point => point[1])
    return { rings, minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) }
  })
  if (!polygons.length) fail('E_STATION_BOUNDARY', STATION_BOUNDARY_PATH)
  return ([lon, lat]) => polygons.some(({ rings, minX, maxX, minY, maxY }) => {
    if (lon < minX || lon > maxX || lat < minY || lat > maxY) return false
    const point = [lon, lat]
    const outer = ringPosition(point, rings[0])
    return outer === 0 || outer === 1 && rings.slice(1).every(ring => ringPosition(point, ring) !== 1)
  })
}

export function validateStationCatalogGeography(catalog, boundaryBytes) {
  const contains = seoulBoundaryContains(boundaryBytes)
  const names = new Set()
  let rowCount = 0
  for (const [blockIndex, block] of catalog.content.entries()) {
    if (block.kind !== 'table') continue
    for (const [rowIndex, row] of block.rows.entries()) {
      const pointer = STATION_CATALOG_PATH + '#/content/' + blockIndex + '/rows/' + rowIndex
      for (const locale of ['ko', 'en']) {
        const latitude = row[2]?.[locale], longitude = row[3]?.[locale]
        const lat = Number(latitude), lon = Number(longitude)
        if (typeof latitude !== 'string' || !latitude.trim() || !Number.isFinite(lat) || Math.abs(lat) > 90)
          fail('E_STATION_COORDINATE', pointer + '/2/' + locale)
        if (typeof longitude !== 'string' || !longitude.trim() || !Number.isFinite(lon) || Math.abs(lon) > 180)
          fail('E_STATION_COORDINATE', pointer + '/3/' + locale)
        if (!contains([lon, lat])) fail('E_STATION_OUTSIDE', pointer + '/2/' + locale)
      }
      names.add(row[0].ko)
      rowCount += 1
    }
  }
  if (!rowCount) fail('E_STATION_COORDINATE', STATION_CATALOG_PATH + '#/content')
  const members = new Set()
  for (const [index, group] of catalog.data.station_aliases.entries()) {
    for (const [memberIndex, name] of [group.id, ...group.aliases].entries()) {
      const pointer = STATION_CATALOG_PATH + '#/data/station_aliases/' + index
        + (memberIndex === 0 ? '/id' : '/aliases/' + (memberIndex - 1))
      if (!names.has(name) || members.has(name)) fail('E_STATION_ALIAS_SOURCE', pointer)
      members.add(name)
    }
  }
  return { rowCount, aliasGroups: catalog.data.station_aliases.length, boundarySha256: sourceSha256 }
}

export async function loadStationCatalogGeography(root, { catalog, readBytes = readFile } = {}) {
  catalog ??= readCanonicalDocument(STATION_CATALOG_PATH, { databasePath: process.env.WIKI_DOCUMENT_DB ?? resolve(root, 'data/canonical/wiki-cast.sqlite') })
  return validateStationCatalogGeography(catalog, await readBytes(resolve(root, STATION_BOUNDARY_PATH)))
}

export function outsideStationIds(archiveBytes, boundaryBytes, stationAliases) {
  if (createHash('sha256').update(archiveBytes).digest('hex') !== stationArchiveSha256)
    fail('E_STATION_ARCHIVE_HASH', STATION_ARCHIVE_PATH)
  const contains = seoulBoundaryContains(boundaryBytes)
  const canonicalIds = new Map(stationAliases.flatMap(entry => [entry.id, ...entry.aliases].map(id => [id, entry.id])))
  const stations = JSON.parse(archiveBytes).stations
  const insideIds = new Set(stations.filter(station => contains([station.lon, station.lat])).map(station => canonicalIds.get(station.id) ?? station.id))
  const excludedIds = new Set(stations.filter(station => !contains([station.lon, station.lat])).map(station => canonicalIds.get(station.id) ?? station.id))
  for (const id of excludedIds) if (insideIds.has(id)) fail('E_STATION_ALIAS_BOUNDARY', id)
  return [...excludedIds]
}

export async function loadOutsideStationIds(root, { stationAliases, readBytes = readFile } = {}) {
  return outsideStationIds(readSourceArchive(STATION_ARCHIVE_PATH, stationArchiveSha256,
    process.env.WIKI_DOCUMENT_DB ?? resolve(root, 'data/canonical/wiki-cast.sqlite')),
    await readBytes(resolve(root, STATION_BOUNDARY_PATH)), stationAliases)
}
