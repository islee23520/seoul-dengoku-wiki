import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../data/geography')
const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'))
const expected = new Map([
  ['서울특별시', 427], ['경기도', 602], ['충청북도', 153],
  ['충청남도', 208], ['대전광역시', 82], ['세종특별자치시', 24],
  ['강원특별자치도', 188],
])
for (const entry of manifest.files) {
  const path = resolve(root, entry.path)
  if (!path.startsWith(`${root}/`)) throw new Error(`Unsafe path: ${entry.path}`)
  if ((await stat(path)).size !== entry.bytes) throw new Error(`File size mismatch: ${entry.path}`)
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(path)) hash.update(chunk)
  if (hash.digest('hex') !== entry.sha256) throw new Error(`File SHA-256 mismatch: ${entry.path}`)
}
const boundaries = JSON.parse(await readFile(resolve(root, 'boundaries/selected-regions.geojson'), 'utf8'))
const counts = new Map()
for (const feature of boundaries.features) {
  const name = feature.properties.sidonm
  if (!expected.has(name) || !feature.geometry?.coordinates?.length) throw new Error(`Invalid boundary: ${name}`)
  counts.set(name, (counts.get(name) ?? 0) + 1)
}
if (manifest.regions.length !== expected.size) throw new Error('Missing region manifest')
for (const [name, count] of expected) {
  if (counts.get(name) !== count) throw new Error(`Boundary count mismatch: ${name}`)
  if (manifest.regions.find(region => region.name === name)?.administrativeUnits !== count) throw new Error(`Manifest count mismatch: ${name}`)
}
if (!manifest.files.some(file => file.path === manifest.osm.file && file.bytes > 100000000)) throw new Error('Missing actual national OSM source')
if (manifest.files.filter(file => file.path.startsWith('terrain-mapzen/')).length !== manifest.terrain.tiles) throw new Error('Missing terrain tile')
console.log(`GEOGRAPHY_VERIFY_PASS regions=${expected.size} units=${boundaries.features.length} files=${manifest.files.length}`)
