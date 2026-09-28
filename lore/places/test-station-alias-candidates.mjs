import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'
import { readRendered } from '../../scripts/lore-read-rendered.mjs'

const places = import.meta.dirname
const candidate = JSON.parse(readFileSync(resolve(places, 'Station-Alias-Candidates.json'), 'utf8'))
const catalogData = JSON.parse(readFileSync(resolve(places, 'Seoul-Station-Catalog.json'), 'utf8'))
const interiors = JSON.parse(readFileSync(resolve(places, '../regions/station-interiors.json'), 'utf8'))
const projected = JSON.parse(readFileSync(resolve(places, '../../public/opening-territories.json'), 'utf8'))
const catalog = readRendered(resolve(places, '..'), 'places', 'Seoul-Station-Catalog')
const rows = [...catalog.matchAll(/^\| ([^|]+) \| [^|]* \| 37\.[^|]* \| 12[^|]* \|[^|]*\|$/gmu)].map((match) => match[1])

test('the candidate classifies every same-base pair without altering the 334-row roster', () => {
  assert.equal(candidate.status, 'approved-alias-only')
  assert.equal(rows.length, 334)
  assert.equal(interiors.stations.length, 334)
  const grouped = Map.groupBy(rows, (name) => name.replace(/\s*\(.*\)$/u, ''))
  const pairs = [...grouped.values()].filter((names) => names.length > 1)
  assert.equal(pairs.length, 19)
  assert.deepEqual(candidate.groups.map((group) => group.members.slice().sort().join('|')).sort(), pairs.map((pair) => pair.slice().sort().join('|')).sort())
  assert.equal(candidate.groups.filter((group) => group.disposition === 'approved-alias').length, 18)
  assert.deepEqual(candidate.groups.find((group) => group.disposition === 'nonmerge').members, ['신촌', '신촌(지하)'])
})

test('Isu identity is approved while both observed platforms and four graph neighbors remain', () => {
  const isu = candidate.groups.find((group) => group.relatedStation === '이수')
  const canonical = catalogData.data.station_aliases.find((station) => station.id === '총신대입구(이수)')
  assert.deepEqual(canonical.aliases, ['이수', '총신대입구 (이수)'])
  assert.deepEqual(canonical.observed_lines, { '이수': ['7'], '총신대입구 (이수)': ['4'], '총신대입구(이수)': ['4'] })
  assert.deepEqual(catalogData.data.station_aliases.map((station) => station.id), ['총신대입구(이수)', '삼성', '수유', '서울대입구', '강변', '구의', '아현', '대림', '충정로', '교대', '남부터미널', '방배', '왕십리', '한성대입구', '잠실', '경복궁', '혜화', '회현'])
  assert.equal(isu.disposition, 'approved-alias')
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
    ['아현', '아현(추계예술대)', '2', 'B2', ['이대', '충정로']],
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

test('all approved subtitles project one node without losing observed lines or movement neighbors', () => {
  const canonicalId = new Map(catalogData.data.station_aliases.flatMap((entry) => [entry.id, ...entry.aliases].map((id) => [id, entry.id])))
  const original = JSON.parse(readFileSync(resolve(places, '../../../GAME/Assets/Janseon/Data/Content/SeoulWorldGraph.json'), 'utf8'))
  const lines = JSON.parse(readFileSync(resolve(places, '../../scripts/official-seoul-lines.json'), 'utf8')).stations
  const projectedEdges = new Set(projected.edges.flatMap((edge) => edge.lineIds.map((line) => `${[edge.a, edge.b].sort().join('|')}/${line}`)))
  for (const entry of catalogData.data.station_aliases) {
    assert.deepEqual(projected.stations.filter((station) => station.id === entry.id).map((station) => station.memberIds), [[entry.id, ...entry.aliases]])
    assert.ok(entry.aliases.every((alias) => !projected.stations.some((station) => station.id === alias)))
    for (const [source, lines] of Object.entries(entry.observed_lines)) {
      const observation = interiors.stations.find((station) => station.name === source)
      assert.ok(observation, source)
      assert.deepEqual(observation.observed_levels.lines.map((line) => line.line), lines, source)
    }
  }
  for (const edge of original.edges) {
    const a = canonicalId.get(edge.a) ?? edge.a
    const b = canonicalId.get(edge.b) ?? edge.b
    if (a !== b) for (const line of (lines[edge.a] ?? []).filter((id) => lines[edge.b]?.includes(id))) {
      assert.ok(projectedEdges.has(`${[a, b].sort().join('|')}/${line}`), `${edge.a}/${edge.b}/${line}`)
    }
  }
  assert.deepEqual(projected.stations.filter((station) => station.id.startsWith('신촌')).map((station) => station.id), ['신촌', '신촌(지하)'])
})

test('cross-region alias observations remain attached to the projected station', () => {
  for (const id of ['삼성', '충정로', '남부터미널', '잠실']) {
    const station = projected.stations.find((entry) => entry.id === id)
    assert.deepEqual(station.control.memberSurfaces.map((entry) => entry.id), station.memberIds, id)
    assert.ok(station.control.memberSurfaces.every((entry) => entry.surfaceRegionId && entry.polityIds.length), id)
  }
  const samsung = projected.stations.find((entry) => entry.id === '삼성')
  assert.deepEqual(samsung.control.memberSurfaces.map((entry) => entry.polityIds), [['S04'], ['S16']])
  assert.equal(samsung.control.primary, null)
  assert.equal(samsung.control.hierarchy.regionalAuthority, null)
})

test('every alias member keeps its own control record and only disagreement clears the node control', () => {
  for (const entry of catalogData.data.station_aliases) {
    const station = projected.stations.find((candidate) => candidate.id === entry.id)
    assert.deepEqual(station.control.memberSurfaces.map((member) => member.id), [entry.id, ...entry.aliases], entry.id)
    assert.ok(station.control.memberSurfaces.every((member) => ['source', 'deltaId', 'status', 'primary', 'surfaceRegionId', 'surfaceRegionName', 'polityIds'].every((key) => Object.hasOwn(member, key))), entry.id)
    const records = new Set(station.control.memberSurfaces.map((member) => `${member.status}:${member.primary}:${[...member.polityIds].sort().join(',')}`))
    if (records.size > 1) {
      assert.equal(station.control.status, 'unknown', entry.id)
      assert.deepEqual(station.control.polityIds, [], entry.id)
      assert.equal(station.control.primary, null, entry.id)
    } else {
      const [first] = station.control.memberSurfaces
      assert.equal(station.control.status, first.status, entry.id)
      assert.deepEqual(station.control.polityIds, first.polityIds, entry.id)
      assert.equal(station.control.primary, first.primary, entry.id)
    }
  }
})
