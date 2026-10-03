import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { regionalLineGraph } from './regional-line-graph.mjs'

test('published regional graph preserves every resolved ordinary pair and reports every unresolved pair', async () => {
  const json = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'))
  const source = await json('../lore/places/regular-line-adjacency.json')
  const bindings = await json('../lore/places/regional-station-bindings.json')
  const seoul = await json('../public/opening-territories.json')
  const published = await json('../public/regular-regional-connections.json')
  for (const binding of bindings.bindings) {
    const records = source.lines.flatMap((line) => line.paths.flat().filter((station) => station.code === binding.stationCode).map((station) => ({ station, lineId: line.id === '1-GA-1' ? '1-GA' : line.id })))
    assert.ok(records.some(({ station, lineId }) => station.name === binding.officialName && station.uid === binding.interchangeUid && lineId === binding.lineId), binding.stationCode)
  }
  const expected = regionalLineGraph(source, bindings, seoul.stations)
  assert.deepEqual(published.edges, expected.edges)
  assert.deepEqual(published.unresolved, expected.unresolved)
  assert.deepEqual(published.unresolved, [])
  assert.equal(new Set(published.edges.map((edge) => edge.id)).size, published.edges.length)
  const sinchon = published.edges.filter((edge) => [edge.a.id, edge.b.id].includes('official:1252'))
  assert.deepEqual(new Set(sinchon.map((edge) => edge.lineId)), new Set(['K']))
  assert.deepEqual(new Set(sinchon.flatMap((edge) => [edge.a.id, edge.b.id]).filter((id) => id !== 'official:1252')), new Set(['가좌', '서울역']))
  assert.ok(published.edges.every((edge) => !(edge.lineId === 'K' && [edge.a.id, edge.b.id].includes('신촌'))))
  const unjeong = published.edges.filter((edge) => [edge.a.id, edge.b.id].includes('official:9000'))
  assert.equal(unjeong.length, 1)
  assert.equal(unjeong[0].lineId, '1-GA')
  assert.deepEqual(new Set([unjeong[0].a.name, unjeong[0].b.name]), new Set(['운정중앙', '킨텍스']))
})

test('regional adjacency preserves exact external codes without bridging a missing stop', () => {
  const source = { stationIdsByCode: { a: 'Seoul' }, lines: [{ id: 'K', paths: [[{ code: 'a', name: '서울' }, { code: 'b', name: '동명이역' }, { code: 'c', name: '종점' }]] }] }
  const stations = [{ id: 'Seoul', x: 1, y: 2 }]
  const bindings = { bindings: [{ stationCode: 'b', interchangeUid: '1252', east: 3, north: 4 }] }
  const result = regionalLineGraph(source, bindings, stations)
  assert.equal(result.edges.length, 1)
  assert.equal(result.edges[0].a.id, 'Seoul')
  assert.equal(result.edges[0].b.id, 'official:1252')
  assert.equal(result.edges[0].b.coordinateKind, 'epsg5179')
  assert.deepEqual(result.unresolved, [{ lineId: 'K', codes: ['b', 'c'] }])
  assert.throws(() => regionalLineGraph(source, { bindings: [bindings.bindings[0], bindings.bindings[0]] }, stations), /E_REGIONAL_CODE_DUPLICATE/)
})
