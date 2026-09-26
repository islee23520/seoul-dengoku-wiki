import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'

const places = import.meta.dirname
const candidate = JSON.parse(readFileSync(resolve(places, 'Station-Alias-Candidates.json'), 'utf8'))
const interiors = JSON.parse(readFileSync(resolve(places, '../regions/station-interiors.json'), 'utf8'))
const catalog = readFileSync(resolve(places, 'Seoul-Station-Catalog.md'), 'utf8')
const rows = [...catalog.matchAll(/^\| ([^|]+) \| [^|]* \| 37\.[^|]* \| 12[^|]* \|[^|]*\|$/gmu)].map((match) => match[1])

test('the candidate classifies every same-base pair without altering the 334-row roster', () => {
  assert.equal(candidate.status, 'review-candidate-not-applied')
  assert.equal(rows.length, 334)
  assert.equal(interiors.stations.length, 334)
  const grouped = Map.groupBy(rows, (name) => name.replace(/\s*\(.*\)$/u, ''))
  const pairs = [...grouped.values()].filter((names) => names.length > 1)
  assert.equal(pairs.length, 19)
  assert.deepEqual(candidate.groups.map((group) => group.members.slice().sort().join('|')).sort(), pairs.map((pair) => pair.slice().sort().join('|')).sort())
  assert.equal(candidate.groups.filter((group) => group.disposition === 'alias-candidate').length, 17)
  assert.deepEqual(candidate.groups.find((group) => group.disposition === 'nonmerge').members, ['신촌', '신촌(지하)'])
})

test('Isu remains unresolved with both observed platforms and four graph neighbors', () => {
  const isu = candidate.groups.find((group) => group.relatedStation === '이수')
  assert.equal(isu.disposition, 'identity-choice-required')
  assert.equal(isu.displayName, '총신대입구(이수)')
  assert.deepEqual(isu.aliases, ['총신대입구 (이수)', '이수'])
  for (const observation of isu.observations) {
    const station = interiors.stations.find((entry) => entry.name === observation.sourceName)
    assert.ok(station, observation.sourceName)
    assert.ok(station.observed_levels.lines.some((line) => line.line === observation.line && line.code === observation.code))
  }
  assert.deepEqual(isu.graphNeighbors, {
    이수: ['남성', '내방'],
    '총신대입구 (이수)': ['동작', '사당'],
    '총신대입구(이수)': [],
  })
  for (const name of [...isu.members, isu.relatedStation, '신촌', '신촌(지하)']) assert.ok(rows.includes(name), name)
})
