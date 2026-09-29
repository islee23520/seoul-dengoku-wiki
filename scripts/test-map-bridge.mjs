import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { createMapBridge, selectionAtUnityCoordinate, terrainStatus } from '../src/components/mapBridge.ts'
import { stationAliases } from '../src/components/stationPresentation.ts'

test('all 334 game station IDs select exactly the 315 displayed station IDs', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const outside = JSON.parse(await readFile(new URL('../public/outside-admin-units.json', import.meta.url), 'utf8'))
  const displayIds = new Set(data.stations.map(({ id }) => id))
  const gameIds = new Set([...displayIds, ...Object.keys(stationAliases)])
  assert.equal(displayIds.size, 315)
  assert.equal(gameIds.size, 334)
  const sent = []
  let receive = () => {}
  const selected = []
  const transport = {
    send: (message) => sent.push(message),
    subscribe: (handler) => { receive = handler; return () => { receive = () => {} } },
  }
  const bridge = createMapBridge({ ...data, outsideUnits: outside.units }, transport, (selection) => selected.push(selection))
  for (const id of gameIds) {
    const expected = stationAliases[id] ?? id
    receive({ type: 'selected', selection: { kind: 'station', id } })
    assert.deepEqual(selected[selected.length - 1], { kind: 'station', id: expected }, id)
  }
  assert.equal(new Set(selected.map((selection) => selection?.id)).size, 315)
  receive({ type: 'selected', selection: { kind: 'station', id: '이수' } })
  assert.deepEqual(selected[selected.length - 1], { kind: 'station', id: '총신대입구(이수)' })
  receive({ type: 'selected', selection: { kind: 'station', id: '신촌(지하)' } })
  assert.deepEqual(selected[selected.length - 1], { kind: 'station', id: '신촌(지하)' })
  receive({ type: 'selected', selection: { kind: 'station', id: '신촌' } })
  assert.deepEqual(selected[selected.length - 1], { kind: 'station', id: '신촌' })
  for (const id of displayIds) bridge.select({ kind: 'station', id })
  assert.deepEqual(sent, [...displayIds].map((id) => ({ type: 'select', selection: { kind: 'station', id } })))
  bridge.dispose()
})

test('selection preserves kind and stable ID; unknown or malformed messages cannot select', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const outside = JSON.parse(await readFile(new URL('../public/outside-admin-units.json', import.meta.url), 'utf8'))
  const catalog = { ...data, outsideUnits: outside.units }
  const selected = []
  const sent = []
  let receive = () => {}
  const bridge = createMapBridge(catalog, {
    send: (message) => sent.push(message),
    subscribe: (handler) => { receive = handler; return () => {} },
  }, (selection) => selected.push(selection))
  for (const [kind, id] of [
    ['region', data.regions[0].id], ['state', data.states[0].id],
    ['station', data.stations[0].id], ['segment', data.edges[0].id],
    ['landmark', data.landmarks[0].id], ['vassal', data.vassals[0].name],
    ['outside-unit', outside.units[0].id],
  ]) {
    const selection = { kind, id }
    bridge.select(selection)
    receive({ type: 'selected', selection })
    assert.deepEqual(selected[selected.length - 1], selection)
  }
  assert.equal(sent.length, 7)
  for (const message of [
    { type: 'selected', selection: { kind: 'station', id: 'nonexistent' } },
    { type: 'selected', selection: { kind: 'region', id: data.stations[0].id } },
    { type: 'selected', selection: { kind: 'unknown', id: data.regions[0].id } },
    { type: 'selected', selection: { kind: 'state', id: 7 } },
    { type: 'selected', selection: { kind: 'outside-unit', id: 'nonexistent' } },
    { type: 'other', selection: null },
  ]) receive(message)
  bridge.select({ kind: 'station', id: 'nonexistent' })
  assert.equal(selected.length, 7)
  assert.equal(sent.length, 7)
  receive({ type: 'selected', selection: null })
  bridge.select(null)
  assert.equal(selected[selected.length - 1], null)
  assert.deepEqual(sent[sent.length - 1], { type: 'select', selection: null })
  bridge.dispose()
})

test('disposing the bridge unsubscribes once and ignores late inbound and outbound events', () => {
  let receive = () => {}
  let unsubscribed = 0
  let sent = 0
  let selected = 0
  const bridge = createMapBridge({ regions: [{ id: 'region:1' }], states: [], stations: [], edges: [], landmarks: [], vassals: [], outsideUnits: [] }, {
    send: () => { sent += 1 },
    subscribe: (handler) => { receive = handler; return () => { unsubscribed += 1 } },
  }, () => { selected += 1 })
  bridge.dispose()
  bridge.dispose()
  receive({ type: 'selected', selection: { kind: 'region', id: 'region:1' } })
  bridge.select({ kind: 'region', id: 'region:1' })
  assert.deepEqual([unsubscribed, selected, sent], [1, 0, 0])
})

test('Unity terrain readiness validates pinned tile bytes but never becomes a wiki detail selection', async () => {
  const manifest = JSON.parse(await readFile(new URL('../public/regional-terrain.json', import.meta.url), 'utf8'))
  const tile = manifest.detailTiles.find((item) => item.key === '5-4')
  const hashes = new Map(manifest.detailTiles.map((item) => [item.key, item.sha256]))
  const source = await readFile(new URL('../public/regional-terrain.json', import.meta.url))
  const { createHash } = await import('node:crypto')
  const manifestSha256 = createHash('sha256').update(source).digest('hex')
  const ready = { schema: 'janseon-wiki-map.v1', type: 'ready', projection: 'EPSG:5179',
    selection: { kind: 'regional-terrain-tile', id: 'regional:5-4' },
    sourceSha256: tile.sha256, manifestSha256 }
  assert.deepEqual(terrainStatus(ready, hashes, manifestSha256), { type: 'ready', tile: '5-4', sourceSha256: tile.sha256, manifestSha256 })
  assert.equal(terrainStatus({ ...ready, sourceSha256: '0'.repeat(64) }, hashes, manifestSha256), null)
  assert.equal(terrainStatus({ ...ready, type: 'selection' }, hashes, manifestSha256), null)
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  let selected = 0
  let receive = () => {}
  const bridge = createMapBridge({ ...data, outsideUnits: [] }, {
    send: () => {}, subscribe: (handler) => { receive = handler; return () => {} },
  }, () => { selected += 1 })
  receive({ ...ready, type: 'selection' })
  assert.equal(selected, 0)
  bridge.dispose()
})

test('Unity projected tile click resolves actual outside-unit ID only with pinned manifest and tile hashes', async () => {
  const source = await readFile(new URL('../public/regional-terrain.json', import.meta.url))
  const manifest = JSON.parse(source)
  const { createHash } = await import('node:crypto')
  const manifestSha = createHash('sha256').update(source).digest('hex')
  const map = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const outside = JSON.parse(await readFile(new URL('../public/outside-admin-units.json', import.meta.url), 'utf8')).units
  const tile = manifest.detailTiles.find((item) => item.key === '5-4')
  const click = { schema: 'janseon-wiki-map.v1', type: 'coordinate-selection', projection: 'EPSG:5179',
    selection: { kind: 'regional-terrain-tile', id: 'regional:5-4' },
    east: 962500, north: 1937500, sourceSha256: tile.sha256, manifestSha256: manifestSha }
  assert.deepEqual(selectionAtUnityCoordinate(click, manifest, manifestSha, map, outside), { kind: 'outside-unit', id: '4113164000' })
  assert.equal(selectionAtUnityCoordinate({ ...click, sourceSha256: '0'.repeat(64) }, manifest, manifestSha, map, outside), null)
  assert.equal(selectionAtUnityCoordinate({ ...click, east: 900000 }, manifest, manifestSha, map, outside), null)
})
