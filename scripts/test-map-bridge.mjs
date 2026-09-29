import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { createMapBridge } from '../src/components/mapBridge.ts'
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
