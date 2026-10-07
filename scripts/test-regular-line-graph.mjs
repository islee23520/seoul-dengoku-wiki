import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { regularLineGraph } from './regular-line-graph.mjs'

const station = (code) => ({ code, name: code })

test('generated Seoul segments equal the complete mapped official adjacent pairs', async () => {
  const source = JSON.parse(await readFile(new URL('../lore/places/regular-line-adjacency.json', import.meta.url), 'utf8'))
  const map = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const expected = new Map()
  for (const line of source.lines) {
    const lineId = line.id === '1-GA-1' ? '1-GA' : line.id
    for (const path of line.paths) {
      for (let index = 1; index < path.length; index += 1) {
        const endpoints = [source.stationIdsByCode[path[index - 1].code], source.stationIdsByCode[path[index].code]]
        if (endpoints.some((id) => !id) || endpoints[0] === endpoints[1]) continue
        const key = endpoints.sort().join('~')
        if (!expected.has(key)) expected.set(key, new Set())
        expected.get(key).add(lineId)
      }
    }
  }
  assert.equal(map.edges.length, expected.size)
  for (const edge of map.edges) {
    const key = [edge.a, edge.b].sort().join('~')
    assert.ok(expected.has(key), edge.id)
    assert.deepEqual(new Set(edge.lineIds), expected.get(key), edge.id)
  }
  for (const station of map.stations) {
    const neighbors = new Set(map.edges.filter((edge) => edge.a === station.id || edge.b === station.id).map((edge) => edge.a === station.id ? edge.b : edge.a))
    assert.equal(station.degree, neighbors.size, station.id)
  }
  const sinchon = map.stations.find((entry) => entry.id === '신촌')
  const undergroundSinchon = map.stations.find((entry) => entry.id === '신촌(지하)')
  assert.ok(sinchon)
  assert.ok(undergroundSinchon)
  assert.deepEqual(sinchon.lineIds, ['3-2'])
  assert.deepEqual(undergroundSinchon.lineIds, [])
  assert.equal(undergroundSinchon.degree, 0)
  assert.deepEqual(map.stations.find((entry) => entry.id === '양평').lineIds, ['6-5'])
})

test('GTX-A alternate diagram uses one service identity without duplicate edges', () => {
  const source = { stationIdsByCode: { a: 'A', b: 'B' }, lines: [
    { id: '1-GA', paths: [[station('a'), station('b')]] },
    { id: '1-GA-1', paths: [[station('a'), station('b')]] },
  ] }
  const result = regularLineGraph(source, ['A', 'B'])
  assert.equal(result.edges.length, 1)
  assert.deepEqual(result.edges[0].lineIds, ['1-GA'])
  assert.deepEqual([...result.linesByStation.get('A')], ['1-GA'])
})

test('ordinary adjacency never skips an unmapped intermediate station', () => {
  const source = { stationIdsByCode: { a: 'A', c: 'C' }, lines: [{ id: '9', paths: [[station('a'), station('b'), station('c')]] }] }
  const result = regularLineGraph(source, ['A', 'C'])
  assert.deepEqual(result.edges, [])
  assert.equal(result.omitted.length, 2)
})

test('branch paths do not connect their endpoints and duplicate segments merge by line', () => {
  const source = { stationIdsByCode: { a: 'A', b: 'B', c: 'C', d: 'D' }, lines: [
    { id: '2', paths: [[station('a'), station('b')], [station('c'), station('d')]] },
    { id: '3', paths: [[station('b'), station('a')]] },
  ] }
  const result = regularLineGraph(source, ['A', 'B', 'C', 'D'])
  assert.deepEqual(result.edges.map(({ a, b, lineIds }) => ({ a, b, lineIds })), [
    { a: 'A', b: 'B', lineIds: ['2', '3'] }, { a: 'C', b: 'D', lineIds: ['2'] },
  ])
})

test('exact station codes keep namesakes separate and unify confirmed interchange codes', () => {
  const source = { stationIdsByCode: { a: 'Sinchon-2', b: 'Sinchon-K', c: 'Transfer', d: 'Transfer' }, lines: [
    { id: '2', paths: [[station('a'), station('c')]] },
    { id: 'K', paths: [[station('b'), station('d')]] },
  ] }
  const result = regularLineGraph(source, ['Sinchon-2', 'Sinchon-K', 'Transfer'])
  assert.deepEqual([...result.linesByStation.get('Sinchon-2')], ['2'])
  assert.deepEqual([...result.linesByStation.get('Sinchon-K')], ['K'])
  assert.deepEqual([...result.linesByStation.get('Transfer')], ['2', 'K'])
  assert.throws(() => regularLineGraph(source, ['Sinchon-2', 'Transfer']), /E_REGULAR_LINE_STATION/)
})
