import assert from 'node:assert/strict'
import { test } from 'vitest'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath as urlPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { terrainFixture } from './fixtures/private-map-inputs.mjs'

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

test('private detail tiles verify hashes, dimensions, shared borders and water attribution through the cache', async () => {
  const { manifest: meta, payloads } = terrainFixture()
  assert.equal(meta.detailGrid.projection, 'EPSG:5179')
  assert.equal(meta.detailTiles.length, meta.detailGrid.cols * meta.detailGrid.rows)
  assert.match(meta.detailSources.hydrography[0].license, /ODbL/u)
  assert.match(meta.detailSources.hydrography[0].attribution, /Synthetic.*OpenStreetMap/u)
  const byCell = new Map(meta.detailTiles.map((tile) => [`${tile.col}:${tile.row}`, tile]))
  let polygons = 0
  let lines = 0
  for (const tile of meta.detailTiles) {
    const bytes = payloads.get(tile.file)
    const waterBytes = payloads.get(tile.waterFile)
    assert.equal(bytes.length, tile.width * tile.height * 4, tile.key)
    assert.equal(createHash('sha256').update(bytes).digest('hex'), tile.sha256, tile.key)
    assert.equal(createHash('sha256').update(waterBytes).digest('hex'), tile.waterSha256, tile.key)
    const [west, south, east, north] = tile.bboxEPSG5179
    assert.ok(west < east && south < north, tile.key)
    const neighbor = byCell.get(`${tile.col + 1}:${tile.row}`)
    if (neighbor) {
      const next = payloads.get(neighbor.file)
      for (let row = 0; row < tile.height; row += 1) assert.equal(bytes.readUInt16LE((row * tile.width + tile.width - 1) * 4), next.readUInt16LE(row * neighbor.width * 4), `${tile.key} east seam row ${row}`)
    }
    const below = byCell.get(`${tile.col}:${tile.row + 1}`)
    if (below) {
      const next = payloads.get(below.file)
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
  const installed = new Map()
  let complete
  const completed = new Promise(resolve => { complete = resolve })
  const cache = new TerrainTileCache(async tile => {
    const bytes = payloads.get(tile.file)
    assert.equal(createHash('sha256').update(bytes).digest('hex'), tile.sha256)
    return { value: bytes, bytes: bytes.length }
  }, (key, bytes) => installed.set(key, bytes), () => {}, counts => {
    if (counts.loaded === meta.detailTiles.length && counts.inFlight === 0) complete()
  })
  try {
    cache.update(meta.detailTiles)
    await completed
    assert.deepEqual([...installed.keys()], meta.detailTiles.map(tile => tile.key))
    assert.equal(cache.counts.decodedBytes, [...payloads].filter(([file]) => /^\d-\d\.bin$/u.test(file)).reduce((sum, [, bytes]) => sum + bytes.length, 0))
  } finally { cache.dispose() }
})

test('sourced coastline and river geometry classify dry low land independently of elevation', async () => {
  const { manifest: meta, manifestBytes, payloads } = terrainFixture()
  const directory = await mkdtemp(join(tmpdir(), 'private-terrain-test-'))
  try {
  await writeFile(join(directory, 'regional-terrain.json'), manifestBytes)
  for (const [file, bytes] of payloads) await writeFile(join(directory, file), bytes)
  const run = promisify(execFile)
  const { stdout, stderr } = await run('python3', [urlPath(new URL('./filter-unconnected-islands.py', import.meta.url)), '--public', directory])
  assert.equal(stderr, '')
  const result = JSON.parse(stdout)
  assert.equal(result.componentsBefore, 2)
  assert.equal(result.componentsAfter, 1)
  assert.equal(result.droppedCells, 1)
  const after = JSON.parse(await readFile(join(directory, 'regional-terrain.json'), 'utf8'))
  const far = await readFile(join(directory, meta.farWaterFile))
  assert.equal(createHash('sha256').update(far).digest('hex'), meta.farWaterSha256)
  const peninsula = after.layers.find((layer) => layer.name === 'peninsula')
  const sea = await readFile(join(directory, peninsula.file))
  assert.equal(createHash('sha256').update(sea).digest('hex'), peninsula.sha256)
  const original = payloads.get(peninsula.file)
  let lowLand = false
  let elevatedLand = false
  let sourcedSea = false
  for (let index = 0; index < sea.length; index += 4) {
    const elevation = sea.readUInt16LE(index) - 500
    assert.equal(sea.readUInt16LE(index), original.readUInt16LE(index), 'filter preserves all elevations')
    const seaBit = (sea.readUInt16LE(index + 2) & 0x8000) !== 0
    if (!seaBit && elevation <= 0) lowLand = true
    if (!seaBit && elevation > 0) elevatedLand = true
    if (seaBit) sourcedSea = true
  }
  assert.ok(lowLand && elevatedLand && sourcedSea, 'land, low land and sea are distinct')
  for (const tile of after.detailTiles) {
    const bytes = await readFile(join(directory, tile.file))
    assert.equal(createHash('sha256').update(bytes).digest('hex'), tile.sha256)
    assert.deepEqual(await readFile(join(directory, tile.waterFile)), payloads.get(tile.waterFile), 'water attribution and geometry survive filtering')
  }
  const water = JSON.parse(await readFile(join(directory, meta.detailTiles[0].waterFile)))
  assert.ok(water.features.some((feature) => feature.kind === 'polygon' && feature.tag.water === 'river'), 'private viewport intersects attributed river polygons')
  assert.ok(JSON.parse(far).features.some((feature) => feature.kind === 'line' && feature.tag.waterway === 'river'), 'peninsula far view has sourced river line')
  } finally { await rm(directory, { recursive: true, force: true }) }
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
