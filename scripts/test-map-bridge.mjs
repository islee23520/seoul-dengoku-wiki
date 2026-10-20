import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { test } from 'vitest'
import { createMapBridge, selectionAtUnityCoordinate, terrainStatus } from '../src/components/mapBridge.ts'
import { stationAliases } from '../src/components/stationPresentation.ts'
import { selectAtCoordinates } from '../src/components/mapCoordinateSelection.ts'
import { outsideStationIds, STATION_BOUNDARY_PATH } from './station-catalog-geography.mjs'
import { coordinateMap, outsideUnits, terrainFixture } from './fixtures/private-map-inputs.mjs'

test('coordinate polygon parsing preserves the initial M vertex', () => {
  const map = { width: 10, height: 10, projection: { minEast: 0, maxEast: 10, minNorth: 0, maxNorth: 10 },
    regions: [], geography: { titles: [{ id: 'triangle', rank: 'county', path: 'M0,0L10,0L0,10Z' }] } }
  assert.deepEqual(selectAtCoordinates(1, 9, map, []), { kind: 'region', id: 'triangle' })
  assert.equal(selectAtCoordinates(9, 1, map, []), null)
})

test('terrain status rejects unknown tiles and missing or forged source hashes', () => {
  const event = { schema: 'janseon-wiki-map.v1', type: 'ready', projection: 'EPSG:5179',
    selection: { kind: 'regional-terrain-tile', id: 'regional:6-4' }, manifestSha256: 'm1', residentTiles: ['6-4'] }
  const hashes = new Map([['6-4', 'correct']])
  assert.equal(terrainStatus(event, hashes, 'm1'), null)
  assert.equal(terrainStatus({ ...event, selection: { kind: 'regional-terrain-tile', id: 'regional:unknown' } }, hashes, 'm1'), null)
  assert.equal(terrainStatus({ ...event, type: 'tiles-changed', sourceSha256: 'wrong' }, hashes, 'm1'), null)
})

test('all admitted source station IDs select exactly their displayed facilities and outside2 cannot select', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const displayIds = new Set(data.stations.map(({ id }) => id))
  const archiveBytes = await readFile(new URL('../snapshots/build-inputs/SeoulWorldGraph.json', import.meta.url))
  const source = JSON.parse(archiveBytes)
  const aliases = JSON.parse(await readFile(new URL('../lore/places/Seoul-Station-Catalog.json', import.meta.url), 'utf8')).data.station_aliases
  const excluded = new Set(outsideStationIds(archiveBytes, await readFile(new URL('../' + STATION_BOUNDARY_PATH, import.meta.url)), aliases))
  assert.deepEqual([...excluded].sort(), ['광명사거리', '석수'])
  const canonical = new Map(aliases.flatMap(entry => [entry.id, ...entry.aliases].map(id => [id, entry.id])))
  const members = new Map(data.stations.flatMap((station) => (station.memberIds ?? [station.id]).map((id) => [id, station.id])))
  const gameIds = new Set(source.stations.filter(({ id }) => !excluded.has(canonical.get(id) ?? id)).map(({ id }) => id))
  const expectedDisplayIds = new Set([...gameIds].map(id => canonical.get(id) ?? id))
  assert.deepEqual(new Set(members.keys()), gameIds)
  assert.equal(data.stations.flatMap((station) => station.memberIds ?? [station.id]).length, gameIds.size)
  assert.deepEqual(displayIds, expectedDisplayIds)
  const sent = []
  let receive = () => {}
  const selected = []
  const transport = {
    send: (message) => sent.push(message),
    subscribe: (handler) => { receive = handler; return () => { receive = () => {} } },
  }
  const bridge = createMapBridge({ ...data, outsideUnits }, transport, (selection) => selected.push(selection))
  for (const id of gameIds) {
    const expected = members.get(id)
    receive({ type: 'selected', selection: { kind: 'station', id } })
    assert.deepEqual(selected[selected.length - 1], { kind: 'station', id: expected }, id)
  }
  assert.equal(new Set(selected.map((selection) => selection?.id)).size, expectedDisplayIds.size)
  const admittedSelections = selected.length
  for (const id of excluded) {
    assert.equal(members.has(id), false)
    assert.equal(displayIds.has(id), false)
    receive({ type: 'selected', selection: { kind: 'station', id } })
    bridge.select({ kind: 'station', id })
  }
  assert.equal(selected.length, admittedSelections)
  assert.deepEqual(sent, [])
  assert.equal(members.get('서울'), '서울역')
  assert.equal(members.get('신촌(지하)'), '신촌(지하)')
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
  const catalog = { ...data, geography: { titles: [{ id: 'geography:county:test' }] }, outsideUnits }
  const selected = []
  const sent = []
  let receive = () => {}
  const bridge = createMapBridge(catalog, {
    send: (message) => sent.push(message),
    subscribe: (handler) => { receive = handler; return () => {} },
  }, (selection) => selected.push(selection))
  for (const [kind, id] of [
    ['region', 'geography:county:test'], ['state', data.states[0].id],
    ['station', data.stations[0].id], ['segment', data.edges[0].id],
    ['landmark', data.landmarks[0].id],
  ]) {
    const selection = { kind, id }
    bridge.select(selection)
    receive({ type: 'selected', selection })
    assert.deepEqual(selected[selected.length - 1], selection)
  }
  assert.equal(sent.length, 5)
  for (const message of [
    { type: 'selected', selection: { kind: 'station', id: 'nonexistent' } },
    { type: 'selected', selection: { kind: 'region', id: data.stations[0].id } },
    { type: 'selected', selection: { kind: 'unknown', id: data.regions[0].id } },
    { type: 'selected', selection: { kind: 'state', id: 7 } },
    { type: 'selected', selection: { kind: 'outside-unit', id: 'nonexistent' } },
    { type: 'selected', selection: { kind: 'outside-unit', id: outsideUnits[0].id } },
    { type: 'other', selection: null },
  ]) receive(message)
  bridge.select({ kind: 'station', id: 'nonexistent' })
  assert.equal(selected.length, 5)
  assert.equal(sent.length, 5)
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
  const { manifest, manifestSha256 } = terrainFixture()
  const tile = manifest.detailTiles[0]
  const hashes = new Map(manifest.detailTiles.map((item) => [item.key, item.sha256]))
  const ready = { schema: 'janseon-wiki-map.v1', type: 'ready', projection: 'EPSG:5179',
    selection: { kind: 'regional-terrain-tile', id: `regional:${tile.key}` },
    sourceSha256: tile.sha256, manifestSha256 }
  assert.deepEqual(terrainStatus(ready, hashes, manifestSha256), { type: 'ready', tile: tile.key, sourceSha256: tile.sha256, manifestSha256 })
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

test('Unity projected tile click rejects outside units even with pinned manifest and tile hashes', async () => {
  const { manifest, manifestSha256: manifestSha } = terrainFixture()
  const map = { ...coordinateMap, projection: { minEast: 0, maxEast: 100, minNorth: 300, maxNorth: 400 } }
  const outside = outsideUnits
  const tile = manifest.detailTiles[0]
  const click = { schema: 'janseon-wiki-map.v1', type: 'coordinate-selection', projection: 'EPSG:5179',
    selection: { kind: 'regional-terrain-tile', id: `regional:${tile.key}` },
    east: 80, north: 320, sourceSha256: tile.sha256, manifestSha256: manifestSha }
  const titled = { ...map, geography: { titles: [{ ...outside[0], rank: 'county' }] } }
  assert.deepEqual(selectionAtUnityCoordinate(click, manifest, manifestSha, titled, outside), { kind: 'region', id: outside[0].id })
  assert.equal(selectionAtUnityCoordinate({ ...click, sourceSha256: '0'.repeat(64) }, manifest, manifestSha, titled, outside), null)
  assert.equal(selectionAtUnityCoordinate(click, manifest, manifestSha, map, outside), null)
  assert.equal(selectionAtUnityCoordinate({ ...click, sourceSha256: '0'.repeat(64) }, manifest, manifestSha, map, outside), null)
  assert.equal(selectionAtUnityCoordinate({ ...click, east: 900000 }, manifest, manifestSha, map, outside), null)
})

test('terrainStatus accepts a hash-bound tiles-changed streaming neighborhood', () => {
  const event = { schema: 'janseon-wiki-map.v1', type: 'tiles-changed', projection: 'EPSG:5179', selection: { kind: 'regional-terrain-tile', id: 'regional:6-4' }, sourceSha256: 'b6-4', manifestSha256: 'm1', residentTiles: ['5-4', '6-4'] }
  assert.deepEqual(terrainStatus(event, new Map([['5-4', 'a5-4'], ['6-4', 'b6-4']]), 'm1'), { type: 'streamed', tile: '6-4', residentTiles: ['5-4', '6-4'], manifestSha256: 'm1' })
})

test('terrainStatus rejects tiles-changed with forged residents or foreign manifest', () => {
  const event = { schema: 'janseon-wiki-map.v1', type: 'tiles-changed', projection: 'EPSG:5179', selection: { kind: 'regional-terrain-tile', id: 'regional:6-4' }, sourceSha256: 'b6-4', manifestSha256: 'm1', residentTiles: ['5-4', '9-9'] }
  assert.equal(terrainStatus(event, new Map([['5-4', 'a5-4'], ['6-4', 'b6-4']]), 'm1'), null)
  const foreign = { ...event, manifestSha256: 'm2' }
  assert.equal(terrainStatus(foreign, new Map([['5-4', 'a5-4'], ['6-4', 'b6-4']]), 'm1'), null)
})
