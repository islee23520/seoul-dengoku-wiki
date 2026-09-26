import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'

const places = import.meta.dirname
const candidate = JSON.parse(readFileSync(resolve(places, 'Station-Alias-Candidates.json'), 'utf8'))
const catalogData = JSON.parse(readFileSync(resolve(places, 'Seoul-Station-Catalog.json'), 'utf8'))
const interiors = JSON.parse(readFileSync(resolve(places, '../regions/station-interiors.json'), 'utf8'))
const projected = JSON.parse(readFileSync(resolve(places, '../../wiki/public/opening-territories.json'), 'utf8'))
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

test('Isu identity is approved while both observed platforms and four graph neighbors remain', () => {
  const isu = candidate.groups.find((group) => group.relatedStation === '이수')
  const canonical = catalogData.data.station_aliases.find((station) => station.id === '총신대입구(이수)')
  assert.deepEqual(canonical.aliases, ['이수', '총신대입구 (이수)'])
  assert.deepEqual(canonical.observed_lines, { '이수': ['7'], '총신대입구 (이수)': ['4'], '총신대입구(이수)': ['4'] })
  assert.deepEqual(catalogData.data.station_aliases.map((station) => station.id), ['총신대입구(이수)', '삼성', '수유', '서울대입구', '강변', '구의', '아현'])
  assert.equal(isu.disposition, 'wiki-projection-applied-source-pending')
  assert.equal(isu.displayName, '총신대입구(이수)')
  assert.deepEqual(isu.aliases, ['총신대입구 (이수)', '이수'])
  assert.match(isu.decision, /이수·총신대입구\(이수\).*하나의 역/u)
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
  assert.deepEqual(projected.stations.filter((station) => station.id === canonical.id).map((station) => station.memberIds), [[canonical.id, ...canonical.aliases]])
  assert.deepEqual(new Set(projected.edges.filter((edge) => edge.a === canonical.id || edge.b === canonical.id).map((edge) => edge.a === canonical.id ? edge.b : edge.a)), new Set(['남성', '내방', '동작', '사당']))
  for (const name of [...isu.members, isu.relatedStation, '신촌', '신촌(지하)']) assert.ok(rows.includes(name), name)
})

test('Samsung subtitle shares one observed platform and the same graph neighbors', () => {
  const samsung = catalogData.data.station_aliases.find((station) => station.id === '삼성')
  assert.deepEqual(samsung.aliases, ['삼성(무역센터)'])
  for (const name of [samsung.id, ...samsung.aliases]) {
    assert.ok(rows.includes(name))
    assert.deepEqual(interiors.stations.find((station) => station.name === name).observed_levels.lines.map((line) => [line.line, line.code]), [['2', 'B2']])
  }
  assert.deepEqual(samsung.observed_lines, { 삼성: ['2'], '삼성(무역센터)': ['2'] })
  assert.deepEqual(projected.edges.filter((edge) => edge.a === samsung.id || edge.b === samsung.id).map((edge) => edge.a === samsung.id ? edge.b : edge.a).sort(), ['선릉', '종합운동장'])
  assert.deepEqual(projected.edges.filter((edge) => edge.a === samsung.aliases[0] || edge.b === samsung.aliases[0]), [])
})

test('Suyu subtitle shares its observed platform and graph neighbors', () => {
  const suyu = catalogData.data.station_aliases.find((station) => station.id === '수유')
  assert.deepEqual(suyu.aliases, ['수유(강북구청)'])
  assert.deepEqual(suyu.observed_lines, { 수유: ['4'], '수유(강북구청)': ['4'] })
  for (const name of [suyu.id, ...suyu.aliases]) {
    assert.ok(rows.includes(name))
    assert.deepEqual(interiors.stations.find((station) => station.name === name).observed_levels.lines.map((line) => [line.line, line.code]), [['4', 'B2']])
  }
  assert.deepEqual(projected.edges.filter((edge) => edge.a === suyu.id || edge.b === suyu.id).map((edge) => edge.a === suyu.id ? edge.b : edge.a).sort(), ['미아', '쌍문'])
  assert.deepEqual(projected.edges.filter((edge) => edge.a === suyu.aliases[0] || edge.b === suyu.aliases[0]), [])
})

test('four reviewed subtitle pairs preserve their observed platforms in one map node each', () => {
  const expected = [
    ['서울대입구', '서울대입구(관악구청)', '2', 'B2', ['낙성대', '봉천']],
    ['강변', '강변(동서울터미널)', '2', '2F', ['구의', '잠실나루']],
    ['구의', '구의(광진구청)', '2', '3F', ['강변', '건대입구']],
    ['아현', '아현(추계예술대)', '2', 'B2', ['이대', '충정로', '충정로(경기대입구)']],
  ]
  for (const [id, alias, line, level, neighbors] of expected) {
    const canonical = catalogData.data.station_aliases.find((entry) => entry.id === id)
    assert.deepEqual(canonical.aliases, [alias])
    assert.deepEqual(canonical.observed_lines, { [id]: [line], [alias]: [line] })
    for (const name of [id, alias]) {
      assert.ok(rows.includes(name))
      assert.deepEqual(interiors.stations.find((station) => station.name === name).observed_levels.lines.map((entry) => [entry.line, entry.code]), [[line, level]])
    }
    assert.deepEqual(projected.stations.filter((station) => station.id === id).map((station) => station.memberIds), [[id, alias]])
    assert.deepEqual(projected.edges.filter((edge) => edge.a === id || edge.b === id).map((edge) => edge.a === id ? edge.b : edge.a).sort(), neighbors.slice().sort())
  }
})
