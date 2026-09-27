import assert from 'node:assert/strict'
import test from 'node:test'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const { readFile } = await import('node:fs/promises')
const source = await readFile(new URL('../src/components/terrainTileCache.ts', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
const exports = {}
new Function('exports', 'require', compiled)(exports, require)
const { TerrainTileCache, visibleTerrainTiles } = exports

const tiles = Array.from({ length: 10 }, (_, index) => ({ key: `tile-${index}`, file: `${index}.bin`, width: 65, height: 65, bboxEPSG5179: [index * 100, 0, (index + 1) * 100, 100] }))
const nextTurn = () => new Promise((resolve) => setImmediate(resolve))

test('baked detail tiles verify hashes, dimensions, shared borders and sourced water types', async () => {
  const meta = JSON.parse(await readFile(new URL('../public/regional-terrain.json', import.meta.url), 'utf8'))
  assert.equal(meta.detailGrid.projection, 'EPSG:5179')
  assert.ok(meta.detailTiles.length > 24)
  assert.match(meta.detailSources.hydrography[0].license, /ODbL/u)
  const byCell = new Map(meta.detailTiles.map((tile) => [`${tile.col}:${tile.row}`, tile]))
  let polygons = 0
  let lines = 0
  for (const tile of meta.detailTiles) {
    const bytes = await readFile(new URL(`../public/${tile.file}`, import.meta.url))
    const waterBytes = await readFile(new URL(`../public/${tile.waterFile}`, import.meta.url))
    assert.equal(bytes.length, tile.width * tile.height * 4, tile.key)
    assert.equal(createHash('sha256').update(bytes).digest('hex'), tile.sha256, tile.key)
    assert.equal(createHash('sha256').update(waterBytes).digest('hex'), tile.waterSha256, tile.key)
    const [west, south, east, north] = tile.bboxEPSG5179
    assert.ok(west < east && south < north, tile.key)
    const neighbor = byCell.get(`${tile.col + 1}:${tile.row}`)
    if (neighbor) {
      const next = await readFile(new URL(`../public/${neighbor.file}`, import.meta.url))
      for (let row = 0; row < tile.height; row += 1) assert.equal(bytes.readUInt16LE((row * tile.width + tile.width - 1) * 4), next.readUInt16LE(row * neighbor.width * 4), `${tile.key} east seam row ${row}`)
    }
    const below = byCell.get(`${tile.col}:${tile.row + 1}`)
    if (below) {
      const next = await readFile(new URL(`../public/${below.file}`, import.meta.url))
      for (let col = 0; col < tile.width; col += 1) assert.equal(bytes.readUInt16LE(((tile.height - 1) * tile.width + col) * 4), next.readUInt16LE(col * 4), `${tile.key} south seam col ${col}`)
    }
    const water = JSON.parse(waterBytes)
    for (const feature of water.features) {
      assert.match(feature.id, /^(way|relation)\/\d+$/u)
      assert.ok(feature.tag.waterway === 'river' || feature.tag.waterway === 'stream' || feature.tag.waterway === 'riverbank' || feature.tag.water === 'river')
      const points = feature.kind === 'polygon' ? feature.coordinates.flat() : feature.coordinates
      assert.ok(points.every(([x, y]) => x >= west - 1 && x <= east + 1 && y >= south - 1 && y <= north + 1), `${tile.key}:${feature.id}`)
      if (feature.kind === 'polygon') polygons += 1
      else lines += 1
    }
  }
  assert.ok(polygons > 0, 'sourced river polygon exists')
  assert.ok(lines > 0, 'sourced river or stream line exists')
})

test('sourced coastline and river geometry classify dry low land independently of elevation', async () => {
  const meta = JSON.parse(await readFile(new URL('../public/regional-terrain.json', import.meta.url), 'utf8'))
  const far = await readFile(new URL(`../public/${meta.farWaterFile}`, import.meta.url))
  assert.equal(createHash('sha256').update(far).digest('hex'), meta.farWaterSha256)
  const sea = await readFile(new URL('../public/regional-peninsula.bin', import.meta.url))
  const peninsula = meta.layers.find((layer) => layer.name === 'peninsula')
  assert.equal(createHash('sha256').update(sea).digest('hex'), peninsula.sha256)
  let lowLand = false
  let elevatedLand = false
  let sourcedSea = false
  for (let index = 0; index < sea.length; index += 4) {
    const elevation = sea.readUInt16LE(index) - 500
    const seaBit = (sea.readUInt16LE(index + 2) & 0x8000) !== 0
    if (!seaBit && elevation <= 0) lowLand = true
    if (!seaBit && elevation > 0) elevatedLand = true
    if (seaBit) sourcedSea = true
  }
  assert.ok(lowLand && elevatedLand && sourcedSea, 'land, low land and sea are distinct')
  const hanTile = meta.detailTiles.find((tile) => tile.bboxEPSG5179[0] <= 955000 && tile.bboxEPSG5179[2] >= 955000 && tile.bboxEPSG5179[1] <= 1950000 && tile.bboxEPSG5179[3] >= 1950000)
  const water = JSON.parse(await readFile(new URL(`../public/${hanTile.waterFile}`, import.meta.url)))
  assert.ok(water.features.some((feature) => feature.kind === 'polygon' && feature.tag.water === 'river'), 'Han viewport intersects sourced river polygons')
  assert.ok(JSON.parse(far).features.some((feature) => feature.kind === 'line' && feature.tag.waterway === 'river'), 'peninsula far view has sourced river line')
})

test('peninsula footprint requests no local terrain and Seoul footprint selects only visible cells', () => {
  assert.deepEqual(visibleTerrainTiles(tiles, [0, 0, 1000, 100], [500, 50], 0), [])
  assert.deepEqual(visibleTerrainTiles(tiles, [212, 25, 288, 75], [250, 50]).map((tile) => tile.key), ['tile-2'])
})

test('orbit within a footprint reuses in-flight and installed tiles', async () => {
  const pending = new Map()
  const installed = []
  const cache = new TerrainTileCache((tile, signal) => new Promise((resolve) => pending.set(tile.key, { resolve, signal })), (key) => installed.push(key), () => {}, () => {})
  cache.update(tiles.slice(2, 4))
  cache.update(tiles.slice(2, 4))
  assert.equal(cache.counts.requests, 2)
  for (const entry of pending.values()) entry.resolve({ value: {}, bytes: 32 })
  await nextTurn()
  cache.update(tiles.slice(2, 4))
  assert.equal(cache.counts.requests, 2)
  assert.deepEqual(installed, ['tile-2', 'tile-3'])
  cache.dispose()
})

test('pan and unmount abort stale requests and evict meshes inside memory bounds', async () => {
  const pending = new Map()
  const removed = []
  const installed = []
  const cache = new TerrainTileCache((tile, signal) => new Promise((resolve) => pending.set(tile.key, { resolve, signal })), (key) => installed.push(key), (key) => removed.push(key), () => {}, 2, 1, 34000)
  cache.update(tiles.slice(0, 2))
  assert.equal(cache.counts.inFlight, 1)
  const stale = pending.get('tile-0')
  cache.update(tiles.slice(4, 6))
  assert.equal(stale.signal.aborted, true)
  stale.resolve({ value: {}, bytes: 32 })
  await nextTurn()
  assert.deepEqual(installed, [])
  pending.get('tile-4').resolve({ value: {}, bytes: 32 })
  await nextTurn()
  pending.get('tile-5').resolve({ value: {}, bytes: 32 })
  await nextTurn()
  assert.equal(cache.counts.loaded, 2)
  assert.equal(cache.counts.decodedBytes, 64)
  cache.update(tiles.slice(0, 2))
  assert.deepEqual(removed, ['tile-4', 'tile-5'])
  assert.equal(cache.counts.decodedBytes, 65 * 65 * 4)
  const pendingBack = pending.get('tile-0')
  cache.dispose()
  assert.equal(pendingBack.signal.aborted, true)
  pendingBack.resolve({ value: {}, bytes: 32 })
  await nextTurn()
  assert.equal(cache.counts.loaded, 0)
})
