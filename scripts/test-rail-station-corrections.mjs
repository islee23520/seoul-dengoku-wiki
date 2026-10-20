import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { correctedRailStations } from '../src/components/railStationCorrections.ts'

test('every sourced regional interchange has one marker and retains its exact official line set', async () => {
  const source = JSON.parse(await readFile(new URL('../lore/places/rail-station-identities.json', import.meta.url), 'utf8'))
  const corrections = JSON.parse(await readFile(new URL('../lore/places/rail-station-corrections.json', import.meta.url), 'utf8'))
  // Exercise every approved observed member, not the retired, already-corrected
  // public rail output. Empty incoming memberships must be replaced by identity.
  const stations = source.groups.flatMap(identity => identity.members.map(member => ({ name: identity.name, ...member, lineIds: [] })))
  stations.push(...corrections.corrections.map(({ name, east, north, lineIds }) => ({ name, east, north, lineIds: [...lineIds] })))
  const original = structuredClone(stations)
  const result = correctedRailStations(stations)
  for (const identity of source.groups) {
    const matches = result.filter((station) => station.name === identity.name && identity.members.some((member) => member.east === station.east && member.north === station.north))
    assert.equal(matches.length, 1, identity.name)
    assert.deepEqual(new Set(matches[0].lineIds), new Set(identity.lineIds), identity.name)
  }
  for (const station of stations) {
    const member = source.groups.some((identity) => identity.name === station.name && identity.members.some((point) => point.east === station.east && point.north === station.north))
    if (!member) assert.ok(result.some((entry) => entry.name === station.name && entry.east === station.east && entry.north === station.north), station.name)
  }
  assert.deepEqual(stations, original)
})

test('rail correction removes namesake line only from its exact observed point', () => {
  const stations = [
    { name: '신촌', east: 950265, north: 1950797, lineIds: ['3-2', 'K'] },
    { name: '신촌', east: 950266, north: 1950797, lineIds: ['K'] },
    { name: '양평', east: 945758, north: 1947549, lineIds: ['6-5', 'K'] },
    { name: '양평', east: 999999, north: 1947549, lineIds: ['K'] },
  ]
  const corrected = correctedRailStations(stations)
  assert.deepEqual(corrected.map((entry) => entry.lineIds), [['3-2'], ['K'], ['6-5'], ['K']])
  assert.deepEqual(stations[0].lineIds, ['3-2', 'K'])
})

test('confirmed regional interchange members collapse without merging an unlisted namesake', () => {
  const stations = [
    { name: '대곡', east: 939089, north: 1959377, lineIds: ['4-3', 'K'] },
    { name: '대곡', east: 939183, north: 1959437, lineIds: ['1-GA'] },
    { name: '대곡', east: 0, north: 0, lineIds: ['other'] },
  ]
  const result = correctedRailStations(stations)
  assert.equal(result.length, 2)
  assert.ok(result[0].lineIds.includes('1-GA'))
  assert.ok(result[0].lineIds.includes('SH'))
  assert.deepEqual(result[1], stations[2])
})
