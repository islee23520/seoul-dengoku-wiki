import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { cp, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const root = resolve(import.meta.dirname, '..')
const output = resolve(root, 'data/geography')
const seoulSource = process.argv[2]
if (!seoulSource) throw new Error('Usage: node scripts/acquire-geography.mjs SEOUL_SOURCE_BUNDLE')
const boundaryUrl = 'https://raw.githubusercontent.com/vuski/admdongkor/7360288277dfd12d74e54b959c59bdd66f852e3a/ver20260701/HangJeongDong_ver20260701.geojson'
const boundaryHash = 'c01ef44a0eb00978662ba7a6240ccb1da287fb52abd85104a1758969d391132f'
const names = ['서울특별시', '경기도', '충청북도', '충청남도', '대전광역시', '세종특별자치시', '강원특별자치도']
const files = []
const hashFile = async path => {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(path)) hash.update(chunk)
  return hash.digest('hex')
}
const download = async (url, path) => {
  const destination = resolve(output, path)
  await mkdir(dirname(destination), { recursive: true })
  const response = await fetch(url, { signal: AbortSignal.timeout(1800000) })
  if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}: ${url}`)
  await pipeline(Readable.fromWeb(response.body), createWriteStream(destination, { flags: 'wx' }))
  const record = { path, sourceUrl: url, retrievedAt: new Date().toISOString(), bytes: (await stat(destination)).size, sha256: await hashFile(destination), lastModified: response.headers.get('last-modified') }
  files.push(record)
  console.log(`GEOGRAPHY_FILE ${path} ${record.bytes} ${record.sha256}`)
  return destination
}

await mkdir(output, { recursive: true })
const seoulTarget = resolve(output, 'seoul-20260830')
await mkdir(seoulTarget)
for (const entry of await readdir(seoulSource, { withFileTypes: true })) {
  if (entry.name.startsWith('_')) continue
  await cp(resolve(seoulSource, entry.name), resolve(seoulTarget, entry.name), { recursive: true, errorOnExist: true, force: false })
}
const prior = JSON.parse(await readFile(resolve(seoulSource, 'manifest.json'), 'utf8'))
const visit = async (directory, prefix = '') => {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${prefix}${entry.name}`
    if (entry.isDirectory()) await visit(resolve(directory, entry.name), `${path}/`)
    else files.push({ path: `seoul-20260830/${path}`, bytes: (await stat(resolve(directory, entry.name))).size, sha256: await hashFile(resolve(directory, entry.name)), provenance: 'seoul-20260830/manifest.json' })
  }
}
await visit(seoulTarget)
console.log(`SEOUL_BUNDLE_PRESERVED dataFiles=${prior.counts.data_files}`)
const boundaryPath = await download(boundaryUrl, 'boundaries/admdongkor-20260701.geojson')
if (await hashFile(boundaryPath) !== boundaryHash) throw new Error('Pinned boundary SHA-256 mismatch')
const boundary = JSON.parse(await readFile(boundaryPath, 'utf8'))
const selected = boundary.features.filter(feature => names.includes(feature.properties.sidonm))
const regions = names.map(name => {
  const features = selected.filter(feature => feature.properties.sidonm === name)
  if (!features.length) throw new Error(`Boundary missing region: ${name}`)
  return { name, sido: String(features[0].properties.sido), administrativeUnits: features.length, districts: new Set(features.map(feature => feature.properties.sgg)).size }
})
await writeFile(resolve(output, 'boundaries/selected-regions.geojson'), JSON.stringify({ type: 'FeatureCollection', features: selected }))
files.push({ path: 'boundaries/selected-regions.geojson', bytes: (await stat(resolve(output, 'boundaries/selected-regions.geojson'))).size, sha256: await hashFile(resolve(output, 'boundaries/selected-regions.geojson')), derivedFrom: 'boundaries/admdongkor-20260701.geojson', filter: 'properties.sidonm in manifest.regions[].name' })
const bounds = [Infinity, Infinity, -Infinity, -Infinity]
const coordinates = value => {
  if (typeof value[0] === 'number') {
    bounds[0] = Math.min(bounds[0], value[0]); bounds[1] = Math.min(bounds[1], value[1])
    bounds[2] = Math.max(bounds[2], value[0]); bounds[3] = Math.max(bounds[3], value[1])
  } else for (const child of value) coordinates(child)
}
for (const feature of selected) coordinates(feature.geometry.coordinates)
await download('https://download.geofabrik.de/asia/south-korea-261009.osm.pbf', 'osm/south-korea-20261009.osm.pbf')
await download('https://download.geofabrik.de/asia/south-korea.poly', 'osm/south-korea.poly')
await download('https://www.openstreetmap.org/copyright', 'licenses/osm-copyright.html')
await download('https://raw.githubusercontent.com/vuski/admdongkor/7360288277dfd12d74e54b959c59bdd66f852e3a/LICENSE-DATA', 'licenses/admdongkor-LICENSE-DATA')
const z = 11, scale = 2 ** z
const tileX = lon => Math.floor((lon + 180) / 360 * scale)
const tileY = lat => Math.floor((1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * scale)
const tiles = []
for (let x = tileX(bounds[0]); x <= tileX(bounds[2]); x++) {
  for (let y = tileY(bounds[3]); y <= tileY(bounds[1]); y++) tiles.push({ x, y })
}
let cursor = 0
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < tiles.length) {
    const { x, y } = tiles[cursor++]
    await download(`https://s3.amazonaws.com/elevation-tiles-prod/geotiff/${z}/${x}/${y}.tif`, `terrain-mapzen/z${z}/${x}/${y}.tif`)
  }
}))
const manifest = {
  schemaVersion: 1,
  ownership: 'seoul-dengoku-wiki',
  regions,
  bounds,
  boundary: { date: '2026-07-01', sha256: boundaryHash, sourceUrl: boundaryUrl, authority: 'SGIS-derived community dataset, not official-current certification', license: 'CC-BY-4.0', attribution: '통계청 SGIS 행정동 경계(공공누리 제1유형)를 가공한 vuski/admdongkor' },
  osm: { file: 'osm/south-korea-20261009.osm.pbf', scope: 'South Korea superset of every requested region; no regional objects discarded', license: 'ODbL-1.0', attribution: '© OpenStreetMap contributors', sourceDate: '2026-10-09', visualizationPolicy: 'Existing Seoul z14 MVTs are preserved. New regions use the raw OSM source, not precomputed MVTs.' },
  terrain: { zoom: z, tiles: tiles.length, coverage: 'Full bounding rectangle of all selected administrative polygons, including islands', units: 'm', nodata: -32768, source: 'Mapzen/AWS Terrain Tiles', attribution: 'Mapzen, USGS and applicable NOAA; original per-object X-Imagery-Sources and modified dates are not observation dates', licenseRecord: 'seoul-20260830/licenses' },
  publication: 'Source data only; no authored post-collapse content or runtime implementation is claimed',
  files: files.sort((a, b) => a.path.localeCompare(b.path)),
}
await writeFile(resolve(output, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`GEOGRAPHY_COMPLETE regions=${regions.length} units=${selected.length} terrain=${tiles.length} files=${files.length}`)
