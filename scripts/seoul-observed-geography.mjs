import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
export const SOURCE_FILES = {
  spatial: { path: 'data/geography/elections/sources/seoul-sgis-20250630.json', sha256: '389b1eabee54cddc965dd523c3b831cdc60ea72d180cab908295c3359a8045ad' },
  membership: { path: 'data/geography/elections/sources/seoul-constituency-membership.json', sha256: '5c082aad68af1145dca138d8bf048a9b16e5a13b8618aa7c8c2e79bfc3db74f1' },
  geometry: { path: 'data/geography/boundaries/seoul-sgis-20250630.geojson', sha256: '6a393cefb7cc257f001042acb8715e5d721b320e14eba723f15857197edaa5e4' },
}

function requireThat(condition, message) {
  if (!condition) throw new Error(`Observed geography: ${message}`)
}

function index(rows, key, count, label) {
  requireThat(Array.isArray(rows) && rows.length === count, `${label} count`)
  const result = new Map()
  for (const row of rows) {
    requireThat(typeof row[key] === 'string' && row[key].length > 0 && !result.has(row[key]), `${label} duplicate or missing ${key}`)
    result.set(row[key], row)
  }
  return result
}

function sameSet(a, b, label) {
  requireThat(Array.isArray(a) && Array.isArray(b) && new Set(a).size === a.length && new Set(b).size === b.length && a.length === b.length && a.every(id => b.includes(id)), `${label} membership mismatch`)
}

function rings(geometry) {
  requireThat(geometry && ['Polygon', 'MultiPolygon'].includes(geometry.type), 'polygon geometry required')
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  requireThat(Array.isArray(polygons) && polygons.length > 0, 'empty polygon')
  return polygons.flatMap(polygon => {
    requireThat(Array.isArray(polygon) && polygon.length > 0, 'empty polygon rings')
    for (const ring of polygon) {
      requireThat(Array.isArray(ring) && ring.length >= 4 && ring.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite) && p[0] >= -180 && p[0] <= 180 && p[1] >= -90 && p[1] <= 90), 'invalid coordinates')
      requireThat(ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1], 'unclosed ring')
    }
    return polygon
  })
}

export async function readObservedSources(directory = root) {
  const result = {}
  for (const [kind, source] of Object.entries(SOURCE_FILES)) {
    const bytes = await readFile(resolve(directory, source.path))
    requireThat(createHash('sha256').update(bytes).digest('hex') === source.sha256, `${kind} source SHA-256 mismatch`)
    result[kind] = JSON.parse(bytes.toString('utf8'))
  }
  return result
}

export function buildObservedGeography({ spatial, membership, geometry }) {
  requireThat(spatial.schema === 'seoul-sgis-spatial-edition.v1' && spatial.edition === 'sgis-20250630' && spatial.baseDate === '2025-06-30' && spatial.authority === 'official-SGIS-statistical-boundary', 'spatial edition')
  requireThat(membership.schema === 'seoul-constituency-membership.v1' && geometry.type === 'FeatureCollection', 'source schema')
  requireThat(spatial.geometry.sha256 === SOURCE_FILES.geometry.sha256 && spatial.membership.sha256 === SOURCE_FILES.membership.sha256 && spatial.geometry.crs === 'OGC:CRS84', 'source binding')
  const counties = index(spatial.counties, 'geometryId', 48, 'county')
  const constituencies = index(membership.constituencies, 'constituencyId', 48, 'constituency')
  const dongs = index(spatial.dongs, 'electoralDongId', 426, 'dong')
  index(spatial.dongs, 'dongId', 426, 'dong identity')
  index(spatial.dongs, 'officialCode', 426, 'dong code')
  const gu = index(membership.gu, 'guId', 25, 'gu')
  index(spatial.gu, 'guId', 25, 'spatial gu')
  sameSet(spatial.gu.map(row => row.guId), [...gu.keys()], 'gu')
  for (const row of spatial.gu) requireThat(row.name === gu.get(row.guId).name, 'gu name join')
  for (const [rows, kind] of [[spatial.dongs, 'dong'], [spatial.gu, 'gu'], [spatial.counties, 'county']]) {
    for (const row of rows) requireThat(row.kind === kind && row.sourceEdition === spatial.edition, `${kind} identity`)
  }
  const features = index(geometry.features, 'id', 500, 'geometry')
  sameSet([...features.keys()], [...spatial.dongs, ...spatial.gu, ...spatial.counties, spatial.city].map(row => row.geometryId), 'geometry')
  for (const row of [...spatial.dongs, ...spatial.gu, ...spatial.counties]) {
    const feature = features.get(row.geometryId)
    for (const field of ['kind', 'sourceEdition', 'officialCode', 'officialName', 'dongId', 'electoralDongId', 'countyTitleId', 'guId', 'name']) {
      if (field in row) requireThat(feature.properties[field] === row[field], `geometry ${field} join`)
    }
    if (row.kind === 'county') {
      sameSet(feature.properties.officialDongCodes, row.officialDongCodes, 'geometry county dong')
      sameSet(feature.properties.jurisdictionGuRefs, row.jurisdictionGuRefs, 'geometry county gu')
    }
    rings(feature.geometry)
  }
  const city = features.get(spatial.city.geometryId)
  requireThat(city.properties.kind === 'city' && city.properties.sourceEdition === spatial.edition && city.properties.officialCode === '11', 'city join')
  const cityRings = rings(city.geometry)
  let west = Infinity, east = -Infinity, south = Infinity, north = -Infinity
  for (const ring of cityRings) for (const [lon, lat] of ring) {
    west = Math.min(west, lon); east = Math.max(east, lon)
    south = Math.min(south, lat); north = Math.max(north, lat)
  }
  // Equirectangular projection at Seoul's mid-latitude; one common scale
  // preserves geographic aspect instead of stretching both axes to 1000.
  const longitudeScale = Math.cos((north + south) / 2 * Math.PI / 180)
  const spanX = (east - west) * longitudeScale, spanY = north - south
  requireThat(spanX > 0 && spanY > 0, 'degenerate city bounds')
  const scale = 1000 / Math.max(spanX, spanY)
  const left = (1000 - spanX * scale) / 2, top = (1000 - spanY * scale) / 2
  const path = feature => rings(feature.geometry).map(ring => ring.map(([lon, lat], i) => {
    requireThat(lon >= west && lon <= east && lat >= south && lat <= north, 'county outside Seoul bounds')
    return `${i === 0 ? 'M' : 'L'}${(left + (lon - west) * longitudeScale * scale).toFixed(3)},${(top + (north - lat) * scale).toFixed(3)}`
  }).join('') + 'Z').join('')
  const seen = new Set()
  const output = [...constituencies.values()].map(constituency => {
    const id = `geography:county:${constituency.constituencyId}`
    const county = counties.get(id)
    requireThat(county && county.name === constituency.name, 'county join')
    sameSet(county.jurisdictionGuRefs, constituency.jurisdictionGuRefs, 'county gu')
    const slots = constituency.electoralDongs.map(member => {
      requireThat(!seen.has(member.electoralDongId), 'duplicate electoral membership')
      seen.add(member.electoralDongId)
      const dong = dongs.get(member.electoralDongId)
      requireThat(dong && dong.countyTitleId === id && dong.guId === member.guId && county.jurisdictionGuRefs.includes(member.guId), 'dong county join')
      requireThat(dong.officialName === member.normalizedLookupName, 'dong name join')
      requireThat(member.fragmentId === null, 'unsupported electoral fragment')
      return { id: `geography:barony:${dong.electoralDongId}`, name: dong.officialName, dongId: dong.dongId, fragmentId: member.fragmentId }
    })
    sameSet(county.officialDongCodes, constituency.electoralDongs.map(member => dongs.get(member.electoralDongId).officialCode), 'county dong')
    return { id, name: county.name, path: path(features.get(id)), jurisdictionGuNames: county.jurisdictionGuRefs.map(id => {
      requireThat(gu.has(id), 'unknown gu')
      return gu.get(id).name
    }), slots }
  })
  sameSet([...seen], [...dongs.keys()], 'all electoral dongs')
  index(output.flatMap(county => county.slots), 'id', 426, 'slot')
  const sources = [
    { id: 'sgis-archive', url: spatial.archive.url, sha256: spatial.archive.sha256 },
    { id: 'sgis-derived-geojson', url: 'https://media.githubusercontent.com/media/islee23520/seoul-dengoku-wiki/e9c12a43728a599c371d373088e177a446ff5051/data/geography/boundaries/seoul-sgis-20250630.geojson', sha256: SOURCE_FILES.geometry.sha256 },
    ...spatial.sources.map(({ id, url, sha256 }) => ({ id, url, sha256 })),
    ...membership.sources.filter(source => source.role === 'statutory-electoral-membership').map(({ id, url, sha256 }) => ({ id, url, sha256 })),
  ]
  index(sources, 'id', sources.length, 'public source')
  for (const source of sources) requireThat(/^https:\/\//.test(source.url) && /^[0-9a-f]{64}$/.test(source.sha256), 'public source provenance')
  return {
    schema: 'seoul-observed-geography.v1', sourceEdition: spatial.edition, baseDate: spatial.baseDate, width: 1000, height: 1000,
    sources, counties: output,
  }
}

export async function generateObservedGeography(directory = root) {
  const payload = buildObservedGeography(await readObservedSources(directory))
  await mkdir(resolve(directory, 'public'), { recursive: true })
  await writeFile(resolve(directory, 'public/seoul-observed-geography.json'), JSON.stringify(payload) + '\n')
  return payload
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const payload = await generateObservedGeography()
  console.log(`Observed geography: ${payload.counties.length} counties, ${payload.counties.flatMap(county => county.slots).length} slots`)
}
