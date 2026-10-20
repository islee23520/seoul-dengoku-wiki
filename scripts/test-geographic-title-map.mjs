import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import { projectGeographicTitles, titlesAtRank, resolveGeographicTitle, resolveGeographicSelection, geographicTitleColor, projectPhysicalRail } from '../src/components/geographicTitleMap.mjs'
import { selectAtCoordinates } from '../src/components/mapCoordinateSelection.ts'
import { createMapBridge } from '../src/components/mapBridge.ts'

const staging = JSON.parse(await readFile(new URL('../lore/regions/seoul-electoral-titles.json', import.meta.url)))
const boundaries = JSON.parse(await readFile(new URL('../data/geography/boundaries/seoul-sgis-20250630.geojson', import.meta.url)))
const geography = projectGeographicTitles(staging, boundaries, (x, y) => [x, y])

test('physical rail projects independent authenticated pieces without inventing line or station bindings', () => {
  const subset = {
    schema_version: 'seoul-physical-rail.v1', projection: 'EPSG:4326',
    boundary_sha256: '6a393cefb7cc257f001042acb8715e5d721b320e14eba723f15857197edaa5e4',
    osm_sha256: '70007aa979f8e362ca609fdc2d6302164c2f1379f11c8fc5fd39a7a2e79d3c17',
    station_binding_status: 'missing-evidence', passage2126: 'unknown', edges: [],
    paths: [0, 2].map(index => ({ id: `osm:way:7:piece:${index}`, osm_way: 7, mode: 'subway', points: [[126 + index, 37], [126 + index, 38]] })),
  }
  const result = projectPhysicalRail(subset, (x, y) => [x * 2, y * 3])
  assert.equal(result.projection, 'EPSG:5179')
  assert.equal(result.paths.length, 2)
  assert.deepEqual(result.paths.map(path => path.id), ['osm:way:7:piece:0', 'osm:way:7:piece:2'])
  assert.deepEqual(result.paths[0].points, [[252, 111], [252, 114]])
  assert.ok(result.paths.every(path => path.lineId === 'osm:railway:subway'))
  assert.throws(() => projectPhysicalRail({ ...subset, osm_sha256: 'forged' }, (x, y) => [x, y]), /E_MAP_PHYSICAL_RAIL_CONTRACT/)
  assert.throws(() => projectPhysicalRail({ ...subset, edges: [{}] }, (x, y) => [x, y]), /E_MAP_PHYSICAL_RAIL_CONTRACT/)
})

test('projects 48 counties, 25 duchies, six kingdoms and one empire without private evidence or rights', () => {
  assert.deepEqual(['county', 'duchy', 'kingdom', 'empire'].map(rank => titlesAtRank(geography, rank).length), [48, 25, 6, 1])
  assert.equal(titlesAtRank(geography, 'county').flatMap(title => title.datedSlots).length, 426)
  assert.equal(titlesAtRank(geography, 'county').flatMap(title => title.currentSlots).length, 427)
  assert.equal(new Set(titlesAtRank(geography, 'kingdom').flatMap(title => title.countyIds)).size, 48)
  assert.ok(geography.titles.every(title => title.path.startsWith('M') && title.holderPersonId === null))
  assert.ok(!JSON.stringify(geography).includes('.omo/'))
  assert.ok(!JSON.stringify(geography).includes('historicalHoldingRefs'))
  assert.equal(resolveGeographicTitle(geography, 'region:1111051500'), null)
  assert.equal(resolveGeographicTitle(geography, '4113164000'), null)
  assert.equal(geographicTitleColor(geography.titles[0].id), geographicTitleColor(geography.titles[0].id))
})

test('current dong ID and unique exact name select only their one county', () => {
  const counties = titlesAtRank(geography, 'county')
  const slots = counties.flatMap(county => county.currentSlots.map(slot => ({ county, slot })))
  const unique = slots.find(({ slot }) => slots.filter(entry => entry.slot.name === slot.name).length === 1)
  assert.ok(unique)
  assert.equal(resolveGeographicSelection(geography, unique.slot.dongId)?.id, unique.county.id)
  assert.equal(resolveGeographicSelection(geography, unique.slot.dongId.slice(7))?.id, unique.county.id)
  const district = resolveGeographicTitle(geography, unique.county.parentId)
  assert.equal(resolveGeographicSelection(geography, `${district.name}/${unique.slot.name}`)?.id, unique.county.id)
  assert.equal(resolveGeographicSelection(geography, unique.slot.name)?.id, unique.county.id)
  assert.equal(resolveGeographicSelection(geography, unique.county.id)?.id, unique.county.id)
  assert.equal(resolveGeographicTitle(geography, unique.slot.dongId), null)
})

test('split, ambiguous, dated-only and outside requests do not select a county', () => {
  const county = titlesAtRank(geography, 'county')[0]
  const slot = county.currentSlots[0]
  const other = titlesAtRank(geography, 'county')[1]
  const split = { ...geography, titles: geography.titles.map(title => title.id === other.id ? { ...title, currentSlots: [...title.currentSlots, slot] } : title) }
  assert.equal(resolveGeographicSelection(split, slot.dongId), null)
  assert.equal(resolveGeographicSelection(split, slot.name), null)
  const nameCollision = { ...geography, titles: geography.titles.map(title => title.id === other.id ? { ...title, currentSlots: [...title.currentSlots, { ...slot, dongId: 'region:other' }] } : title) }
  assert.equal(resolveGeographicSelection(nameCollision, slot.name), null)
  assert.equal(resolveGeographicSelection(nameCollision, slot.dongId)?.id, county.id)
  const datedOnly = { ...geography, titles: geography.titles.map(title => title.id === county.id ? { ...title, currentSlots: title.currentSlots.filter(entry => entry.dongId !== slot.dongId), datedSlots: [...title.datedSlots, slot] } : title) }
  assert.equal(resolveGeographicSelection(datedOnly, slot.dongId), null)
  assert.equal(resolveGeographicSelection(geography, '4113164000'), null)
  assert.equal(resolveGeographicSelection(geography, 'region:4113164000'), null)
  assert.equal(resolveGeographicSelection(geography, 'unknown'), null)
  assert.equal(resolveGeographicSelection(geography, null), null)
})

test('county click uses title ID and never falls back to dong or outside geometry', () => {
  const title = titlesAtRank(geography, 'county')[0]
  const fixture = { width: 10, height: 10, projection: { minEast: 0, maxEast: 10, minNorth: 0, maxNorth: 10 }, regions: [{ id: 'dong', path: 'M0,0L10,0L10,10L0,10Z' }], geography: { titles: [{ ...title, path: 'M0,0L5,0L5,10L0,10Z' }] } }
  assert.deepEqual(selectAtCoordinates(1, 9, fixture, []), { kind: 'region', id: title.id })
  assert.equal(selectAtCoordinates(9, 1, fixture, [{ id: 'outside', path: 'M0,0L10,0L10,10L0,10Z' }]), null)
  assert.equal(selectAtCoordinates(12, 1, fixture, []), null)
  assert.equal(selectAtCoordinates(NaN, 1, fixture, []), null)
})

test('map requires published geography and renders political centers without ownership polygons', async () => {
  const map = await readFile(new URL('../src/components/OpeningTerritoryMap.tsx', import.meta.url), 'utf8')
  assert.match(map, /E_MAP_GEOGRAPHY_REQUIRED/u)
  assert.match(map, /if \(geographyMissing\) return <p role="status"/u)
  assert.match(map, /title\.rank === 'county' && title\.path\.startsWith\('M'\)\)\.length !== 48/u)
  assert.match(map, /title\.rank === 'empire' && title\.path\.startsWith\('M'\)\)\.length !== 1/u)
  assert.doesNotMatch(map, /regional-terrain\.json|farWaterFile|reliefImage/u)
  assert.match(map, /mode === 'titles' \? geographicTitleColor\(title\.id, titlesAtRank\(data\.geography, rank\)\.map\(entry => entry\.id\)\) : political\.color/u)
  assert.doesNotMatch(map, /data\.vassals\.map|regionBorders\(|data-gtx-project-segment/u)
})

test('bridge keeps region wire kind but accepts only geographic title IDs and rejects direct outside IDs', () => {
  let receive
  const selected = [], sent = []
  const catalog = { geography, regions: [{ id: 'dong' }], states: [], stations: [], edges: [], landmarks: [], vassals: [{ name: 'outside-vassal' }], outsideUnits: [{ id: 'outside' }] }
  const bridge = createMapBridge(catalog, { send: event => sent.push(event), subscribe: fn => { receive = fn; return () => {} } }, event => selected.push(event))
  for (const selection of [{ kind: 'outside-unit', id: 'outside' }, { kind: 'vassal', id: 'outside-vassal' }, { kind: 'region', id: 'dong' }]) {
    bridge.select(selection)
    receive({ type: 'selected', selection })
  }
  assert.deepEqual([sent.length, selected.length], [0, 0])
  const selection = { kind: 'region', id: titlesAtRank(geography, 'county')[0].id }
  bridge.select(selection)
  receive({ type: 'selected', selection })
  assert.deepEqual(selected, [selection])
  assert.deepEqual(sent, [{ type: 'select', selection }])
  bridge.dispose()
})
