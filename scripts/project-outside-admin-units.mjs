import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import proj4 from 'proj4'

export const sourceSha256 = 'c01ef44a0eb00978662ba7a6240ccb1da287fb52abd85104a1758969d391132f'
export const preservationRevision = 'ccd789401e73d24f8d99233f0db5b1c66d0da339'
const preservationSha256 = 'e9cd0ac7ecf7ed878e9532f1f8b7c647548f7b71facfec532956dc7f47196f6b'
const root = fileURLToPath(new URL('../', import.meta.url))
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
const provinces = new Set(['28', '30', '36', '41', '43', '44', '51'])
proj4.defs('EPSG:5179', '+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs')

// No original outside-unit producer is retained in the repository. Preserve its
// exact CCD output as an input, not as a claim of newly recomputed old geometry.
export function preservationInput() {
  const bytes = execFileSync('git', ['-C', root, 'show', `${preservationRevision}:public/outside-admin-units.json`], { maxBuffer: 2_000_000 })
  assert.equal(sha256(bytes), preservationSha256, 'E_OUTSIDE_PRESERVATION_HASH')
  return JSON.parse(bytes)
}

export function selectedSource(bytes) {
  assert.equal(sha256(bytes), sourceSha256, 'E_OUTSIDE_SOURCE_HASH')
  const source = JSON.parse(bytes)
  assert.equal(source.crs?.properties?.name, 'urn:ogc:def:crs:OGC:1.3:CRS84', 'E_OUTSIDE_SOURCE_CRS')
  assert.equal(source.features.length, 3558, 'E_OUTSIDE_SOURCE_COVERAGE')
  return source
}

export function geometryPath(geometry, map) {
  assert.equal(map.projection.crs, 'EPSG:5179', 'E_OUTSIDE_MAP_CRS')
  const { minEast, maxEast, minNorth, maxNorth } = map.projection
  assert.ok(maxEast > minEast && maxNorth > minNorth && map.width > 0 && map.height > 0, 'E_OUTSIDE_MAP_BOUNDS')
  assert.ok(['Polygon', 'MultiPolygon'].includes(geometry.type), 'E_OUTSIDE_GEOMETRY')
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  return polygons.flatMap(polygon => polygon.map(ring => {
    assert.ok(ring.length >= 4, 'E_OUTSIDE_RING')
    assert.deepEqual(ring[0], ring.at(-1), 'E_OUTSIDE_RING_CLOSURE')
    return ring.map(([lon, lat], index) => {
      const [east, north] = proj4('EPSG:4326', 'EPSG:5179', [lon, lat])
      const x = (east - minEast) / (maxEast - minEast) * map.width
      const y = (maxNorth - north) / (maxNorth - minNorth) * map.height
      assert.ok(Number.isFinite(x) && Number.isFinite(y), 'E_OUTSIDE_COORDINATE')
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ') + ' Z'
  })).join(' ')
}

export function projectOutsideUnits(source, previous, map) {
  assert.equal(previous.sourceSha256, sourceSha256, 'E_OUTSIDE_PRESERVATION_SOURCE')
  assert.equal(previous.units.length, 1309, 'E_OUTSIDE_PRESERVATION_COVERAGE')
  const additions = source.features.filter(feature => ['30', '36'].includes(feature.properties.sido))
    .sort((a, b) => a.properties.adm_cd2.localeCompare(b.properties.adm_cd2))
    .map(({ properties: p, geometry }) => ({ id: p.adm_cd2, name: p.adm_nm,
      province: p.sidonm, district: p.sggnm, path: geometryPath(geometry, map), holder2126: null }))
  const result = { ...previous, units: [...previous.units, ...additions] }
  validateOutsideUnits(result, source, previous, map)
  return result
}

export function validateOutsideUnits(output, source, previous, map) {
  assert.deepEqual({ ...output, units: [] }, { ...previous, units: [] }, 'E_OUTSIDE_ENVELOPE')
  assert.deepEqual(output.units.slice(0, previous.units.length), previous.units, 'E_OUTSIDE_PRESERVATION')
  const expected = source.features.filter(feature => provinces.has(feature.properties.sido))
  const byId = new Map(output.units.map(unit => [unit.id, unit]))
  assert.equal(byId.size, output.units.length, 'E_OUTSIDE_DUPLICATE')
  assert.deepEqual([...byId.keys()].sort(), expected.map(feature => feature.properties.adm_cd2).sort(), 'E_OUTSIDE_ID_COVERAGE')
  const oldIds = new Set(previous.units.map(unit => unit.id))
  for (const { properties: p, geometry } of expected) {
    const unit = byId.get(p.adm_cd2)
    assert.equal(unit.name, p.adm_nm, 'E_OUTSIDE_SOURCE_NAME')
    assert.equal(unit.province, p.sidonm, 'E_OUTSIDE_SOURCE_PROVINCE')
    assert.equal(unit.district, p.sggnm, 'E_OUTSIDE_SOURCE_DISTRICT')
    assert.equal(unit.holder2126, null, 'E_OUTSIDE_NO_CONTROL')
    if (!oldIds.has(unit.id)) assert.deepEqual(unit, { id: p.adm_cd2, name: p.adm_nm,
      province: p.sidonm, district: p.sggnm, path: geometryPath(geometry, map), holder2126: null }, 'E_OUTSIDE_SOURCE_GEOMETRY')
  }
  const requested = source.features.filter(feature => ['11', '30', '36', '41', '43', '44', '51'].includes(feature.properties.sido))
  const projected = [...map.regions.map(region => region.id.replace(/^region:/u, '')), ...output.units.filter(unit => unit.province !== '인천광역시').map(unit => unit.id)]
  assert.deepEqual(projected.sort(), requested.map(feature => feature.properties.adm_cd2).sort(), 'E_OUTSIDE_REQUESTED_COVERAGE')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sourcePath = process.argv[2]
  assert.ok(sourcePath, 'Usage: node scripts/project-outside-admin-units.mjs <pinned-national-geojson>')
  const bytes = await readFile(sourcePath)
  const source = selectedSource(bytes)
  const map = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const previous = preservationInput()
  const result = projectOutsideUnits(source, previous, map)
  await writeFile(new URL('../public/outside-admin-units.json', import.meta.url), JSON.stringify(result) + '\n')
  console.log(JSON.stringify({ sourceSha256, preservationRevision, preservationSha256, preserved: previous.units.length,
    added: result.units.length - previous.units.length, total: result.units.length, requestedGeographicCoverage: 1684,
    extraIncheonPreserved: 158, outputSha256: sha256(JSON.stringify(result) + '\n') }))
}
