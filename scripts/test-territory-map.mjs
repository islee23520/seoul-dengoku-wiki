import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { JSDOM } from 'jsdom'
import { test, vi } from 'vitest'
import { presentationStations, stationAliases } from '../src/components/stationPresentation.ts'
import { validatedDensities } from './region-density.mjs'
import { segmentPointerChoices } from '../src/components/segmentPointerSelection.ts'
import { regularLineGraph } from './regular-line-graph.mjs'
import { loadOutsideStationIds } from './station-catalog-geography.mjs'
import { projectOutsideOccupation } from './outside-occupation.mjs'
import { projectCatalogOutsideOccupation } from './generate-catalog.mjs'
import OpeningTerritoryMap, { clampSeoulViewBox } from '../src/components/OpeningTerritoryMap.tsx'
import { titlesAtRank, validateGeographicMap } from '../src/components/geographicTitleMap.mjs'

test('map rejects independent barony rank with E_MAP_GRANULARITY', () => {
  assert.throws(() => titlesAtRank({ titles: [] }, 'barony'), /E_MAP_GRANULARITY/u)
  assert.throws(() => validateGeographicMap({ titles: [{ id: 'barony:fixture', rank: 'barony' }] }), /E_MAP_GRANULARITY/u)
})

test('baked hegemons preserve canonical membership exactly once for every holder', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const source = JSON.parse(await readFile(new URL('../lore/factions/Sixteen-States.json', import.meta.url), 'utf8'))
  assert.deepEqual(data.hegemons, source.data.currentAffiliation.hegemons)
  const members = [...data.hegemons.flatMap(hegemon => hegemon.memberStateIds), ...source.data.currentAffiliation.neutralStateIds]
  assert.equal(data.hegemons.length, 3)
  assert.equal(members.length, 16)
  assert.equal(new Set(members).size, 16)
  assert.deepEqual([...members].sort(), data.states.map(state => state.id).sort())
})

test('legacy exclusive count measures single-state surface assignments, not title rights', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const source = JSON.parse(await readFile(new URL('../lore/factions/Sixteen-States.json', import.meta.url), 'utf8'))
  const affinity = new Map(source.data.currentAffiliation.states.map(state => [state.stateId, state.currentExclusiveDistricts]))
  for (const state of data.states) {
    const expected = affinity.get(state.id) === 'none' ? 0 : data.regions.filter(region => region.polities.length === 1 && region.polities[0] === state.id).length
    assert.equal(state.currentExclusiveDistrictCount, expected, state.id)
  }
})

test('movement edges equal official physical hops and never surface adjacency', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const source = JSON.parse(await readFile(new URL('../lore/places/regular-line-adjacency.json', import.meta.url), 'utf8'))
  const key = (edge) => `${[edge.a, edge.b].sort().join('|')}/${[...edge.lineIds].sort().join(',')}`
  const catalog = JSON.parse(await readFile(new URL('../lore/places/Seoul-Station-Catalog.json', import.meta.url), 'utf8'))
  const excludedStationIds = await loadOutsideStationIds(new URL('../', import.meta.url).pathname,
    { stationAliases: catalog.data.station_aliases })
  const official = regularLineGraph(source, data.stations.map((station) => station.id), { excludedStationIds })
  assert.deepEqual(data.edges.map(key).sort(), official.edges.map(key).sort())
  assert.equal(official.edges.length, 381)
  assert.equal(data.stations.some(station => station.id === '석수'), false)
  assert.equal(data.stations.some(station => station.id === '광명사거리'), false)
  assert.ok(data.edges.every(edge => edge.a !== '광명사거리' && edge.b !== '광명사거리'))
  assert.ok(data.edges.every(edge => edge.a !== '석수' && edge.b !== '석수'))
  const separated = regularLineGraph({ stationIdsByCode: { a: 'one', b: 'two' }, lines: [{ id: '2', paths: [[{ code: 'a' }, { code: 'outside' }, { code: 'b' }]] }], surfaceAdjacency: [['one', 'two']] }, ['one', 'two'])
  assert.deepEqual(separated.edges, [])
  const catalogFixture = regularLineGraph({ stationIdsByCode: { a: '서울A', x: '외부X', b: '서울B' }, lines: [{ id: '1', paths: [[{ code: 'a' }, { code: 'x' }, { code: 'b' }]] }] }, ['서울A', '서울B'], { excludedStationIds: ['외부X'] })
  assert.deepEqual(catalogFixture.edges, [], 'Seoul A → outside X → Seoul B must not become a shortcut')
})

test('Seoul viewport clamps drag and zoom to the playable extent', () => {
  const extent = { width: 1200, height: 900 }
  assert.deepEqual(clampSeoulViewBox({ x: -500, y: -400, width: 600, height: 450 }, extent), { x: 0, y: 0, width: 600, height: 450 })
  assert.deepEqual(clampSeoulViewBox({ x: 1000, y: 800, width: 600, height: 450 }, extent), { x: 600, y: 450, width: 600, height: 450 })
  assert.deepEqual(clampSeoulViewBox({ x: -10, y: -10, width: 5000, height: 5000 }, extent), { x: 0, y: 0, width: 1200, height: 900 })
})

test('underground line options and legend reflect only the approved displayed graph', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  data.lines['fixture:outside'] = { name: 'Outside', color: '#000' }
  data.lines['fixture:station'] = { name: 'Station only', color: '#000' }
  data.lines['fixture:edge'] = { name: 'Edge only', color: '#000' }
  data.stations[0].lineIds.push('fixture:station')
  data.edges[0].lineIds.push('fixture:edge')
  const assets = {
    'opening-territories.json': data,
    'confirmed-person-holdings.json': { holdings: [], titles: [] },
  }
  const dom = new JSDOM('<!doctype html><html><body></body></html>')
  vi.stubGlobal('window', dom.window)
  vi.stubGlobal('document', dom.window.document)
  vi.stubGlobal('Event', dom.window.Event)
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal('cancelAnimationFrame', () => {})
  vi.stubGlobal('fetch', async url => ({ ok: true, json: async () => assets[String(url).split('/').at(-1)] }))
  try {
    await act(async () => root.render(React.createElement(MemoryRouter, {}, React.createElement(OpeningTerritoryMap))))
    await act(async () => host.querySelectorAll('.territory-layer-toggle button')[1].click())
    const select = host.querySelector('select:has(option[value="all"])')
    const optionIds = [...select.options].map(option => option.value)
    const represented = new Set([...data.edges, ...data.stations].flatMap(entry => entry.lineIds))
    assert.deepEqual(optionIds, ['all', ...Object.keys(data.lines).filter(id => represented.has(id))])
    assert.equal(optionIds.includes('I2'), false)
    assert.equal(optionIds.includes('fixture:outside'), false)
    assert.ok(optionIds.includes('fixture:station'))
    assert.ok(optionIds.includes('fixture:edge'))
    for (const lineId of ['all', data.edges[1].lineIds[0], 'fixture:edge', 'fixture:station']) {
      await act(async () => { select.value = lineId; select.dispatchEvent(new Event('change', { bubbles: true })) })
      const expected = data.edges.filter(edge => lineId === 'all' || edge.lineIds.includes(lineId))
      const segments = [...host.querySelectorAll('[data-underground-segment]')]
      assert.deepEqual(segments.map(segment => segment.dataset.undergroundSegment), expected.map(edge => edge.id))
      for (const status of ['held', 'contested', 'unassigned']) {
        const matches = value => status === 'unassigned' ? !['held', 'contested', 'vacant'].includes(value) : value === status
        const count = Number(host.querySelector(`.territory-underground-swatch[data-control-status="${status}"]`).parentElement.textContent.match(/\d+$/u)[0])
        assert.equal(count, expected.filter(edge => matches(edge.control.status)).length)
        assert.equal(count, segments.filter(segment => matches(segment.dataset.controlStatus)).length)
      }
      assert.equal(host.querySelectorAll('[data-station-area]').length, data.stations.filter(station => lineId === 'all' || station.lineIds.includes(lineId)).length)
    }
  } finally {
    await act(async () => root.unmount())
    host.remove()
    vi.unstubAllGlobals()
    dom.window.close()
  }
})

test('Seoul Station control delta preserves each original surface holder independently', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const station = data.stations.find((entry) => entry.id === '서울역')
  assert.deepEqual(station.control.polityIds, ['S06'])
  const members = new Map(station.control.memberSurfaces.map((entry) => [entry.id, entry]))
  assert.deepEqual(members.get('서울역').surfacePolityIds, ['S07'])
  assert.deepEqual(members.get('서울').surfacePolityIds, ['S06'])
  for (const member of members.values()) {
    assert.deepEqual(member.surfacePolityIds, data.regions.find((region) => region.id === member.surfaceRegionId).polities)
  }
})

test('overlapping distinct segment strokes retain both exact IDs independent of paint order', () => {
  const ids = ['segment:first', 'segment:second']
  const segments = ids.map((id) => ({ id, a: { x: 0, y: 0 }, b: { x: 10, y: 0 }, strokeWidth: 4 }))
  const { a, b } = segments[0]
  const point = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  assert.deepEqual(new Set(segmentPointerChoices(point, segments)), new Set(ids))
  assert.deepEqual(new Set(segmentPointerChoices(point, [...segments].reverse())), new Set(ids))
  assert.deepEqual(segmentPointerChoices(point, segments.slice(0, 1)), [ids[0]])
})

test('segment pointer hits stop at finite endpoints and use actual stroke width', () => {
  const segment = { id: 'segment:test', a: { x: 0, y: 0 }, b: { x: 10, y: 0 }, strokeWidth: 4 }
  assert.deepEqual(segmentPointerChoices({ x: 20, y: 0 }, [segment]), [])
  assert.deepEqual(segmentPointerChoices({ x: 5, y: 3 }, [segment]), [])
  assert.deepEqual(segmentPointerChoices({ x: 5, y: 3 }, [{ ...segment, strokeWidth: 7 }]), ['segment:test'])
  const pointSegment = { ...segment, b: segment.a }
  assert.deepEqual(segmentPointerChoices({ x: 1, y: 0 }, [pointSegment]), ['segment:test'])
  assert.deepEqual(segmentPointerChoices({ x: 3, y: 0 }, [pointSegment]), [])
})

test('surface rail uses only published physical geometry and the detail panel stays inside the map', async () => {
  const map = await readFile(new URL('../src/components/OpeningTerritoryMap.tsx', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../src/components/OpeningTerritoryMap.css', import.meta.url), 'utf8')
  assert.match(map, /data\.physicalRail\?\.paths \?\? \[\]/u)
  assert.match(map, /showRail && displayedRail\.map/u)
  assert.match(map, /data-physical-rail-piece=\{path\.id\}/u)
  assert.match(map, /!data\.physicalRail && <p role="status"/u)
  assert.doesNotMatch(map, /showRail && !rail && data\.edges\.flatMap/u)
  assert.doesNotMatch(map, /regional-rail\.json|regular-regional-connections\.json|northern-rail\.json|gtxProjects/u)
  assert.match(styles, /\.territory-map-flat > \.territory-detail \{ position: absolute;/u)
  assert.match(styles, /max-block-size: calc\(100% - 4\.25rem\); overflow-y: auto/u)
})

test('projected density covers all 427 source codes and preserves the unrounded area formula', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const source = JSON.parse(await readFile(new URL('../lore/regions/sources/population-2026-08.json', import.meta.url), 'utf8'))
  const values = validatedDensities(data.regions, source)
  const byId = new Map(data.regions.map((region) => [region.id, region]))
  assert.equal(byId.size, 427)
  for (const region of data.regions) {
    const code = region.id.replace(/^region:/u, '')
    const density = values[code]
    const people = density * (region.areaM2 / 1e6) / source.ratio
    assert.ok(Math.abs(people - Math.round(people)) < 1e-7, code)
    assert.equal(byId.get(region.id)?.density2126, density, code)
  }
  assert.deepEqual(data.vassals, [])
  assert.ok(data.vassals.every((vassal) => !Object.hasOwn(vassal, 'density2126')))
  assert.match(data.populationAttribution, /행정안전부 주민등록 인구통계/u)
})

test('density validation rejects a code that is not in the pinned atlas', async () => {
  const source = JSON.parse(await readFile(new URL('../lore/regions/sources/population-2026-08.json', import.meta.url), 'utf8'))
  const regions = Object.keys(source.density2126ByDong).map((code) => ({ id: `region:${code}` }))
  regions[0] = { id: 'region:9999999999' }
  assert.throws(() => validatedDensities(regions, source), /E_REGION_POPULATION_COVERAGE/u)
})

test('outside observed boundaries preserve historical controls while authenticated current retirement has no selection records', async () => {
  await assert.rejects(readFile(new URL('../public/outside-admin-units.json', import.meta.url)), { code: 'ENOENT' })
  const outside = JSON.parse(await readFile(new URL('./historical-inputs/outside-admin-units.json', import.meta.url), 'utf8'))
  assert.equal(outside.schema, 'outside-seoul-admin-units.v1')
  assert.equal(outside.sourceSha256, 'c01ef44a0eb00978662ba7a6240ccb1da287fb52abd85104a1758969d391132f')
  assert.equal(outside.units.length, 1415)
  assert.equal(new Set(outside.units.map((unit) => unit.id)).size, 1415)
  assert.deepEqual(Object.fromEntries(['경기도', '강원특별자치도', '충청북도', '충청남도', '인천광역시', '대전광역시', '세종특별자치시'].map((province) => [province, outside.units.filter((unit) => unit.province === province).length])), { 경기도: 602, 강원특별자치도: 188, 충청북도: 153, 충청남도: 208, 인천광역시: 158, 대전광역시: 82, 세종특별자치시: 24 })
  assert.ok(outside.units.every((unit) => unit.path.startsWith('M') && unit.holder2126 === null))
  const source = JSON.parse(await readFile(new URL('../lore/regions/outside-control-2126.json', import.meta.url), 'utf8'))
  const islands = JSON.parse(await readFile(new URL('../lore/regions/outside-island-occupation.json', import.meta.url), 'utf8'))
  const bytes = {
    approval: await readFile(new URL('./approved-outside-current-retirement.json', import.meta.url)),
    control: await readFile(new URL('./historical-inputs/outside-control-2126.json', import.meta.url)),
    islands: await readFile(new URL('./historical-inputs/outside-island-occupation.json', import.meta.url)),
  }
  for (const [key, hash] of Object.entries({
    approval: '3a34d1ee5a7648962baeab0142cf9be6aa2d1aeace46737511f42b71d0fb4e59',
    control: '1730b9d63528b02b963d69d0c376ec53fad01a351deeaf4665c1a00486b38707',
    islands: 'c1d71e841201b6886ee3bf01cd14e1319cde466f48f55edcfe9420f02fde6e10',
  })) assert.equal(createHash('sha256').update(bytes[key]).digest('hex'), hash, key)
  const originalControl = JSON.parse(bytes.control), originalIslands = JSON.parse(bytes.islands)
  const historical = projectOutsideOccupation(originalControl, outside, originalIslands)
  assert.equal(historical.assignments.length, 1415)
  assert.equal(originalControl.assignments.length, 1415)
  const counts = Object.fromEntries(['대한민국정부', '규격맹', '종교 연합', '대전'].map(name => [name, originalControl.assignments.filter(row => row.authority?.name === name).length]))
  assert.deepEqual(counts, { 대한민국정부: 502, 규격맹: 495, '종교 연합': 325, 대전: 82 })
  assert.equal(new Set(originalControl.assignments.map(row => row.unitId)).size, 1415)
  assert.ok(originalControl.assignments.every(({ unitId }) => outside.units.some(unit => unit.id === unitId)))
  const approval = JSON.parse(bytes.approval)
  assert.equal(approval.records.length, 1426)
  assert.equal(new Set(approval.records.map(row => row.recordKey)).size, 1426)
  assert.ok(approval.records.every(row => row.status === 'retired-current'))
  const projected = await projectCatalogOutsideOccupation(source, outside, islands, bytes)
  assert.deepEqual(projected, { schema: 'outside-control-2126.v3', assignments: [] })
  assert.equal(source.assignments.length, 0)
  assert.equal(islands.units.length, 0)
  assert.equal(Object.hasOwn(source, 'basis'), false)
  assert.equal(Object.hasOwn(islands, 'openingDecision'), false)
  for (const unit of outside.units) assert.equal(projected.assignments.find(row => row.unitId === unit.id), undefined)
  assert.throws(() => projectOutsideOccupation(source, outside, islands), /E_OUTSIDE_CONTROL_COVERAGE/)
  for (const mutate of [
    value => { value.records.pop() },
    value => { value.records[0].status = 'retained-current' },
    value => { value.records[0].sourceValueSha256 = '0'.repeat(64) },
  ]) {
    const tampered = structuredClone(approval)
    mutate(tampered)
    await assert.rejects(projectCatalogOutsideOccupation(source, outside, islands, { ...bytes, approval: JSON.stringify(tampered) }), { message: 'E_CATALOG_RETIREMENT_HASH:approval' })
  }
  const missing = { ...bytes }
  delete missing.approval
  await assert.rejects(projectCatalogOutsideOccupation(source, outside, islands, missing), { message: 'E_CATALOG_RETIREMENT_HASH:approval' })
  const map = await readFile(new URL('../src/components/OpeningTerritoryMap.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(map, /data-outside-unit=/u)
  assert.doesNotMatch(map, /chooseOutsideUnit|selectedOutsideUnit|outsideUnits/u)
  assert.match(map, /resolveGeographicSelection/u)
})

test('alternate labels share one displayed station while graph nodes and edges remain independent', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const displayed = presentationStations(data.stations)
  assert.equal(data.stations.length, 312)
  assert.equal(data.edges.length, 381)
  assert.equal(Object.keys(stationAliases).length, 19)
  assert.equal(displayed.length, 312)
  for (const [aliasId, primaryId] of Object.entries(stationAliases)) {
    const station = displayed.find((candidate) => candidate.id === primaryId)
    assert.deepEqual(new Set(station.memberIds), new Set(primaryId === '총신대입구(이수)' ? [primaryId, '이수', '총신대입구 (이수)'] : [primaryId, aliasId]), aliasId)
    assert.deepEqual(station.lineIds, [...new Set(station.memberIds.flatMap((id) => data.stations.find((source) => source.id === id)?.lineIds ?? []))], aliasId)
    assert.equal(displayed.some((candidate) => candidate.id === aliasId), false, aliasId)
  }
  const isu = displayed.find((station) => station.id === '총신대입구(이수)')
  const catalog = JSON.parse(await readFile(new URL('../lore/places/Seoul-Station-Catalog.json', import.meta.url), 'utf8'))
  const approved = catalog.data.station_aliases.find((station) => station.id === '총신대입구(이수)')
  assert.deepEqual(new Set(isu.memberIds), new Set([approved.id, ...approved.aliases]))
  assert.deepEqual(isu.names, [approved.id])
  assert.equal(data.stations.filter((station) => [approved.id, ...approved.aliases].includes(station.id)).length, 1)
  assert.deepEqual(new Set(data.edges.filter((edge) => isu.memberIds.includes(edge.a) || isu.memberIds.includes(edge.b)).map((edge) => isu.memberIds.includes(edge.a) ? edge.b : edge.a)), new Set(['남성', '내방', '동작', '사당']))
  const underground = JSON.parse(await readFile(new URL('../public/underground-detail.json', import.meta.url), 'utf8'))
  assert.equal(underground.stations[approved.id]['5-4'].platformM, 13.55)
  assert.equal(underground.stations[approved.id]['8-7'].platformM, 22.62)
  assert.equal(underground.stations[approved.id]['5-4'].floors, 'B2')
  assert.equal(underground.stations[approved.id]['8-7'].floors, 'B4')
  const samsung = catalog.data.station_aliases.find((station) => station.id === '삼성')
  assert.deepEqual(displayed.find((station) => station.id === samsung.id).memberIds, [samsung.id, ...samsung.aliases])
  assert.equal(data.stations.filter((station) => [samsung.id, ...samsung.aliases].includes(station.id)).length, 1)
  assert.equal(data.stations.find((station) => station.id === samsung.id).degree, 2)
  assert.deepEqual(data.edges.filter((edge) => edge.a === samsung.id || edge.b === samsung.id).map((edge) => edge.a === samsung.id ? edge.b : edge.a).sort(), ['선릉', '종합운동장'])
  assert.equal(underground.stations[samsung.id]['3-2'].floors, 'B2')
  const suyu = catalog.data.station_aliases.find((station) => station.id === '수유')
  assert.deepEqual(displayed.find((station) => station.id === suyu.id).memberIds, [suyu.id, ...suyu.aliases])
  assert.equal(data.stations.filter((station) => [suyu.id, ...suyu.aliases].includes(station.id)).length, 1)
  assert.deepEqual(data.edges.filter((edge) => edge.a === suyu.id || edge.b === suyu.id).map((edge) => edge.a === suyu.id ? edge.b : edge.a).sort(), ['미아', '쌍문'])
  assert.equal(underground.stations[suyu.id]['5-4'].floors, 'B2')
  assert.deepEqual(displayed.filter((station) => station.name.startsWith('신촌')).map((station) => station.id), ['신촌', '신촌(지하)'])
  assert.equal(data.stations.find((station) => station.id === '신촌').memberIds, undefined)
  assert.equal(data.stations.find((station) => station.id === '신촌(지하)').memberIds, undefined)
  assert.deepEqual(data.stations.find((station) => station.id === '신촌').lineIds, ['3-2'])
  assert.ok(data.edges.every((edge) => edge.a !== '신촌(지하)' && edge.b !== '신촌(지하)'))
})

test('approved landmark roles project to surveyed facilities without changing surrounding dong ownership', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const source = JSON.parse(await readFile(new URL('../lore/places/landmark-roles.json', import.meta.url), 'utf8'))
  assert.equal(data.landmarks.length, 19)
  assert.deepEqual(data.landmarks.map((site) => site.id), source.sites.map((site) => site.id))
  const byRegion = new Map(data.regions.map((region) => [region.id, region]))
  const byId = new Map(data.landmarks.map((site) => [site.id, site]))
  for (const site of data.landmarks) {
    const region = byRegion.get(site.regionId)
    assert.ok(region, site.id)
    assert.equal(site.surfaceHolderId, region.polities[0], site.id)
    assert.equal(site.isEnclave, site.holderId !== site.surfaceHolderId, site.id)
    assert.ok(Number.isFinite(site.x) && Number.isFinite(site.y), site.id)
    assert.match(site.coordinateSource, /^https:\/\/www\.openstreetmap\.org\/(?:node|way|relation)\/\d+$/u, site.id)
  }
  assert.equal(byId.get('cheong-wa-dae').holderId, 'S06')
  assert.equal(byId.get('lotte-world-tower').connectionStationId, '잠실')
  assert.equal(byId.get('lotte-world-tower').fortification, 'confirmed')
  assert.equal(byId.get('national-assembly').coordinateSource, 'https://www.openstreetmap.org/way/270596342')
  for (const id of ['city-hall', 'seoul-station', 'war-memorial', 'jamsil-stadium', 'bldg63', 'coex', 'gwanghwamun', 'heunginjimun', 'sungnyemun', 'bosingak']) {
    assert.equal(byId.get(id).fortification, 'unknown', id)
    assert.equal(byId.get(id).isEnclave, false, id)
  }
  assert.deepEqual(['jogyesa', 'myeongdong-cathedral'].map((id) => byId.get(id).isEnclave), [true, true])
  assert.equal(data.states.find((state) => state.id === 'S06').capitalStationId, '광화문')
})

test('opening territory map covers every Seoul dong and all sixteen states', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  assert.equal(data.regions.length, 427)
  assert.equal(data.states.find((state) => state.id === 'S04')?.ruler, '오경재')
  assert.equal(data.states.length, 16)
  const expectedStates = {
    S01: '수문국', S02: '규격맹', S03: '태욱그룹', S04: '명부교회',
    S05: '동방사', S06: '대한민국정부', S07: '환적국', S08: '중앙정보부',
    S09: '여의도출자연합회', S10: '안국총림', S11: '성하그룹', S12: '신내운수',
    S13: '흰십자단', S14: '아관사', S15: '명동대교구', S16: '정동노총',
  }
  assert.deepEqual(Object.fromEntries(data.states.map((state) => [state.id, state.name])), expectedStates)
  assert.equal(new Set(data.regions.map((region) => region.id)).size, 427)
  assert.ok(data.regions.every((region) => region.path.length > 0))
  assert.ok(data.regions.every((region) => region.openingState.length > 0))
  assert.equal(data.regions.filter((region) => region.status === 'held').length, 427)
  assert.equal(data.regions.filter((region) => region.status === 'vacant').length, 0)
  assert.equal(data.regions.filter((region) => region.status === 'contested').length, 0)
  assert.ok(data.regions.every((region) => region.polities.length === 1))
  assert.equal(data.regions.filter((region) => ['종로구', '중구'].includes(region.district)).length, 32)
  assert.ok(data.regions.filter((region) => ['종로구', '중구'].includes(region.district)).every((region) => region.polities[0] === 'S06'))
  const contentRoot = new URL('../lore/regions/content/', import.meta.url)
  for (const filename of (await readdir(contentRoot)).filter((name) => /^\d{5}\.json$/u.test(name))) {
    const district = JSON.parse(await readFile(new URL(filename, contentRoot), 'utf8'))
    for (const source of district.regions) {
      const projected = data.regions.find((region) => region.id === source.region_id)
      assert.equal(projected.status, source.content.territory.status, source.region_id)
      assert.deepEqual(projected.polities, source.content.territory.holders.map((holder) => holder.polity), source.region_id)
    }
  }
  assert.ok(data.states.every((state) => Number.isFinite(state.labelX) && Number.isFinite(state.labelY)))
  assert.equal(new Set(data.states.map((state) => `${state.labelX}:${state.labelY}`)).size, 16)
  assert.equal(data.stations.length, 312)
  assert.equal(data.edges.length, 381)
  assert.ok(Object.keys(data.lines).length >= 20)
  assert.ok(data.stations.every((station) => Array.isArray(station.lineIds)))
  // Two line-bearing outside stations were retired; the exact Seoul-only denominator is 307.
  assert.equal(data.stations.filter((station) => station.lineIds.length > 0).length, 307)
  assert.deepEqual(data.stations.filter(station => ['석수', '광명사거리'].includes(station.id)), [])
  assert.ok(data.edges.every((edge) => Array.isArray(edge.lineIds)))
  assert.ok(data.stations.every((station) => ['derived-from-surface', 'outside-surface-atlas', 'control-delta'].includes(station.control?.source)))
  assert.ok(data.stations.every((station) => Object.hasOwn(station.control, 'deltaId')))
  const overrideIds = new Set(JSON.parse(await readFile(new URL('../lore/places/station-control-overrides.json', import.meta.url), 'utf8')).overrides.map(row => row.stationId))
  assert.deepEqual(data.stations.filter(station => station.control.source === 'control-delta').map(station => station.id).sort(), data.stations.filter(station => overrideIds.has(station.id)).map(station => station.id).sort())
  assert.ok(data.stations.filter((station) => station.control?.source === 'outside-surface-atlas').every((station) => station.control.status === 'unknown'))
  assert.ok(data.stations.every((station) => station.control?.hierarchy?.stationManager.endsWith('역장')))
  assert.ok(data.stations.filter((station) => station.control?.source === 'derived-from-surface').every((station) => station.control?.hierarchy?.regionalAuthority === null ? station.control.memberSurfaces?.length > 1 : station.control?.hierarchy?.regionalAuthority.includes('권역 책임자')))
  assert.ok(data.majorStationIds.length >= 16)
  const stationIds = new Set(data.stations.map((station) => station.id))
  assert.ok(data.stations.every((station) => Number.isFinite(station.x) && Number.isFinite(station.y)))
  assert.ok(data.edges.every((edge) => stationIds.has(edge.a) && stationIds.has(edge.b)))
  assert.ok(data.majorStationIds.every((id) => stationIds.has(id)))
  assert.equal(new Set(data.states.map((state) => state.capitalStationId)).size, 16)
  assert.ok(data.states.every((state) => stationIds.has(state.capitalStationId)))
  const pointInPolygon = ([x, y], points) => {
    let inside = false
    for (let index = 0, previous = points.length - 1; index < points.length; previous = index, index += 1) {
      const [currentX, currentY] = points[index]
      const [previousX, previousY] = points[previous]
      if ((currentY > y) !== (previousY > y) && x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX) inside = !inside
    }
    return inside
  }
  const polygonPoints = (path) => [...path.matchAll(/[ML](-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)].map((match) => [Number(match[1]), Number(match[2])])
  for (const state of data.states) {
    const capital = data.stations.find((station) => station.id === state.capitalStationId)
    const regions = data.regions.filter((region) => pointInPolygon([capital.x, capital.y], polygonPoints(region.path)))
    assert.equal(regions.length, 1, `${state.id}:${capital.name}:region`)
    assert.equal(regions[0].status, 'held', `${state.id}:${capital.name}:status`)
    if (['종로구', '중구'].includes(regions[0].district)) assert.deepEqual(regions[0].polities, ['S06'], `${state.id}:${capital.name}:government-block`)
    else assert.deepEqual(regions[0].polities, [state.id], `${state.id}:${capital.name}:owner`)
    if (capital.id === '삼성') {
      assert.deepEqual(capital.control.memberSurfaces.map((entry) => entry.polityIds), [['S04'], ['S16']])
      // 소유자 결정(2026-09-28): 두 표기는 같은 역이고 개막 점유는 명부교회다.
      assert.equal(capital.control.source, 'control-delta')
      assert.equal(capital.control.primary, 'S04')
      assert.equal(capital.control.status, 'held')
    } else {
      assert.deepEqual(capital.control.polityIds, [state.id], `${state.id}:${capital.name}:station`)
      assert.equal(capital.control.status, 'held', `${state.id}:${capital.name}:station-status`)
      assert.equal(capital.control.primary, state.id)
    }
  }
})

test('the City Hall control ledger separates Government guard priority from the S16 capital and roll', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const ledger = JSON.parse(await readFile(new URL('../lore/places/station-control-overrides.json', import.meta.url), 'utf8'))
  const cityHall = data.stations.find((station) => station.id === '시청')
  const delta = ledger.overrides.find((entry) => entry.stationId === '시청')
  assert.deepEqual(cityHall.control.polityIds, delta.polityIds)
  assert.equal(cityHall.control.primary, delta.primary)
  assert.equal(cityHall.control.source, 'control-delta')
  assert.equal(cityHall.control.status, 'held')
  assert.equal(data.states.find((state) => state.id === 'S16').capitalStationId, '수서')
  assert.equal(data.regions.find((region) => region.id === cityHall.control.surfaceRegionId).polities[0], 'S06')
  for (const stationId of ['광화문', '종로3가', '을지로입구']) {
    const station = data.stations.find((entry) => entry.id === stationId)
    assert.deepEqual(station.control.polityIds, ['S06'])
    assert.equal(station.control.primary, 'S06')
  }
})

test('sixteen states carry the chronicle capitals and tier grades', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const expectedCapitals = {
    S01: '양평', S02: '구로', S03: '양재', S04: '삼성', S05: '암사', S06: '광화문',
    S07: '용산', S08: '녹사평', S09: '여의도', S10: '안국', S11: '강남', S12: '신내',
    S13: '제기동', S14: '구의', S15: '명동', S16: '수서',
  }
  const stationById = new Map(data.stations.map((station) => [station.id, station]))
  assert.deepEqual(Object.fromEntries(data.states.map((state) => [state.id, stationById.get(state.capitalStationId)?.name])), expectedCapitals)
  assert.ok(data.states.every((state) => ['강국', '약국', '소국'].includes(state.power)), 'tier vocabulary')
  assert.equal(data.states.find((state) => state.id === 'S06')?.power, '강국')
  assert.equal(data.states.filter((state) => state.power === '강국').length, 6)
  assert.equal(data.states.filter((state) => state.power === '약국').length, 4)
  assert.equal(data.states.filter((state) => state.power === '소국').length, 6)
})

test('person pages project the current state name from the S-ID', async () => {
  const { readdir, readFile } = await import('node:fs/promises')
  const root = new URL('../public/person-details/', import.meta.url)
  const people = await Promise.all((await readdir(root)).filter((name) => name.endsWith('.json')).map(async (name) => JSON.parse(await readFile(new URL(name, root), 'utf8'))))
  const s01 = people.find((person) => person.state === 'S01')
  const s06 = people.find((person) => person.state === 'S06')
  assert.equal(s01?.stateName, '수문국')
  assert.equal(s06?.stateName, '대한민국정부')
  assert.ok(people.filter((person) => person.state === 'S01').every((person) => person.stateName === '수문국'))
  const states = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8')).states
  for (const person of people.filter(person => states.some(state => state.id === person.state))) assert.equal(person.stateName, states.find(state => state.id === person.state).name)
})

test('retired outside vassals have no current selection records while Seoul states remain complete', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  assert.deepEqual(data.vassals, [])
  assert.equal(new Set(data.states.map(state => state.id)).size, 16)
  assert.ok(data.regions.every(region => /^region:11\d{8}$/.test(region.id)))
})

test('retired outside boundary assets are absent and Seoul title geometry remains available', async () => {
  await assert.rejects(readFile(new URL('../public/regional-boundaries.json', import.meta.url)), { code: 'ENOENT' })
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url)))
  assert.ok(data.geography.titles.some(title => title.rank === 'county' && title.path))
})

test('outside terrain is retired and the current map uses Seoul title geometry', async () => {
  for (const file of ['regional-terrain.json', 'regional-metro.bin', 'regional-peninsula.bin']) await assert.rejects(readFile(new URL('../public/' + file, import.meta.url)), { code: 'ENOENT' })
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url)))
  assert.ok(data.geography.titles.find(title => title.rank === 'empire').path)
})

test('northern and regional rail assets are retired in favor of verified Seoul physical rail', async () => {
  for (const file of ['northern-rail.json', 'regional-rail.json']) await assert.rejects(readFile(new URL('../public/' + file, import.meta.url)), { code: 'ENOENT' })
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url)))
  assert.ok(data.physicalRail.paths.length > 0)
  assert.ok(data.physicalRail.paths.every(path => path.points.length >= 2))
})

test('government relations come from the canon table and use only defined terms or null', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const canon = JSON.parse(await readFile(new URL('../lore/factions/Sixteen-States.json', import.meta.url), 'utf8'))
  const relations = new Map(canon.content.find((block) => block.anchor === 'table-gov-relations').rows.map((row) => [row[0].ko, row[1].ko]))
  for (const state of data.states) {
    assert.ok(state.relation === null || ['복속', '보좌', '독립'].includes(state.relation), state.id)
    assert.equal(state.relation, relations.get(state.name) ?? null, state.id)
  }
})

test('all map states project founding, government, foreign relations and dated annals from canon', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const states = JSON.parse(await readFile(new URL('../lore/factions/Sixteen-States.json', import.meta.url), 'utf8'))
  const annals = JSON.parse(await readFile(new URL('../lore/chronology/Century-Annals.json', import.meta.url), 'utf8'))
  const rows = new Map(states.content.find((node) => node.anchor === 'table').rows.map((row) => [row[0].ko, row]))
  const prose = new Set(annals.content.filter((node) => node.kind === 'paragraph').map((node) => typeof node.text?.ko === 'string' ? node.text.ko : node.text?.ko?.map((run) => run.text).join('')))
  for (const state of data.states) {
    const row = rows.get(state.id)
    assert.ok(row, state.id)
    assert.equal(Object.hasOwn(state, 'origin'), false)
    assert.equal(Object.hasOwn(state, 'historicalName'), false)
    assert.equal(state.government, row[4].ko, state.id)
    assert.equal(state.vassals, row[5].ko, state.id)
    assert.equal(state.religion, row[6].ko, state.id)
    assert.equal(state.foreignRelations, row[7].ko, state.id)
    assert.ok(state.chronology.length > 0, state.id)
    for (const event of state.chronology) {
      assert.ok(event.text.includes(state.name) || event.text.includes(state.name), state.id)
      assert.ok(prose.has(event.text), state.id)
      assert.equal(event.sourceRoute, `/world/Century-Annals#${event.year}년`, state.id)
    }
  }
})

test('World and Subway Layers mounts the opening territory map', async () => {
  const page = await readFile(new URL('../src/pages/ArticlePage.tsx', import.meta.url), 'utf8')
  const map = await readFile(new URL('../src/components/OpeningTerritoryMap.tsx', import.meta.url), 'utf8')
  assert.match(page, /World-and-Subway-Layers/)
  assert.match(page, /OpeningTerritoryMap/)
  assert.match(page, /lazy\(\(\) => import\('\.\.\/components\/OpeningTerritoryMap'\)\)/)
  assert.match(page, /<Suspense[^>]*>[\s\S]*<OpeningTerritoryMap \/>[\s\S]*<\/Suspense>\}\s*\n\s*<div className="wiki-article-grid">/)
  assert.match(map, /data-title-id={title.id}/)
  assert.match(map, /data-title-rank={title.rank}/)
  assert.match(map, /data-geographic-detail={selectedTitle.id}/)
  assert.match(map, /selectedState\.currentBase\.name/)
  assert.match(map, /aria-pressed=/)
})

test('flat territory map uses Seoul title boundaries, physical rail and state selection without retired assets', async () => {
  const map = await readFile(new URL('../src/components/OpeningTerritoryMap.tsx', import.meta.url), 'utf8')
  assert.match(map, /fetch\(`\$\{import\.meta\.env\.BASE_URL\}opening-territories\.json`/)
  assert.match(map, /data\.geography\.titles\.find\(title => title\.rank === 'empire'\)!\.path/)
  assert.match(map, /titlesAtRank\(data\.geography, mode === 'titles' \? rank : 'county'\)\.map/)
  assert.doesNotMatch(map, /regional-terrain\.json|regional-peninsula\.bin|farWaterFile|far-water\.json|reliefImage|terrain\.layers|water\.features/)
  assert.match(map, /data-title-id=\{title\.id\}/)
  assert.match(map, /data-flat-territory-map/)
  assert.match(map, /지하철 노선 표시/)
  assert.match(map, /data\.physicalRail\?\.paths/)
  assert.doesNotMatch(map, /regional-rail\.json|northern-rail\.json|territory-transfer-marker/)
  assert.doesNotMatch(map, /connected-rail-stations\.json|gtx-project-connections\.json/)
  assert.match(map, /clampSeoulViewBox\(next, data\)/)
  assert.match(map, /mode === 'titles' \? rank : 'county'/)
  assert.match(map, /data-political-affiliation=/)
  assert.match(map, /서울 정치 권역 범례/)
  assert.doesNotMatch(map, /<StateFlag/)
  assert.match(map, /chooseRegion\(region\)/)
  assert.match(map, /role="button" tabIndex=\{0\}/)
  assert.match(map, /event\.key === 'Enter' \|\| event\.key === ' '/)
  assert.match(map, /selectedState\.slug/)
  assert.match(map, /서울 전체/)
  assert.match(map, /검증된 서울 철도 선형 자료가 없어 노선을 표시하지 않습니다/)
  assert.doesNotMatch(map, /OrbitControls|data-three-territory-map|undergroundGroup/)
  assert.doesNotMatch(map, /<StateFlag/)
})

test('territory generator reads states, capitals and vassals from current lore canon', async () => {
  const generator = await readFile(new URL('./generate-catalog.mjs', import.meta.url), 'utf8')
  const inputs = await readFile(new URL('./person-detail-inputs.mjs', import.meta.url), 'utf8')
  assert.match(inputs, /lore\/factions\/Sixteen-States\.md/)
  assert.doesNotMatch(generator, /WEB\/lore\/factions\/Sixteen-States\.md/)
  assert.match(generator, /stateIdByName/)
  assert.match(generator, /const vassals = \[\]/)
  assert.match(generator, /projectPersonStateInputs/)
  assert.doesNotMatch(generator, /Chaebol-Houses-and-Century-Factions\.md/)
})

test('selecting a state also selects its capital region and shows state information', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const map = await readFile(new URL('../src/components/OpeningTerritoryMap.tsx', import.meta.url), 'utf8')

  assert.ok(data.states.every((state) => typeof state.capitalRegionId === 'string' && state.capitalRegionId.length > 0))
  assert.ok(data.states.every((state) => state.government.length > 0 && state.ruler.length > 0 && state.cause.length > 0))
  assert.match(map, /chooseState/)
  assert.match(map, /setSelectedId\(state\.capitalRegionId\)/)
  assert.match(map, /territory-detail-panel/)
  assert.match(map, /selectedState\.name/)
  assert.match(map, /selectedState\.government/)
  assert.match(map, /selectedState\.ruler/)
  assert.match(map, /selectedState\.currentBase\.name/)
})

test('flat map pans and zooms without orbit controls', async () => {
  const map = await readFile(new URL('../src/components/OpeningTerritoryMap.tsx', import.meta.url), 'utf8')
  assert.match(map, /onPointerMove/)
  assert.doesNotMatch(map, /onWheel/)
  assert.doesNotMatch(map, /OrbitControls|오빗/)
})

test('offline underground asset preserves observed depths, unknowns and graph membership', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const detail = JSON.parse(await readFile(new URL('../public/underground-detail.json', import.meta.url), 'utf8'))
  assert.equal(detail.schema, 'underground-detail.v1')
  assert.match(detail.verticalScale, /5 metres/)
  assert.deepEqual(Object.keys(detail.stations).sort(), data.stations.map((station) => station.id).sort())
  for (const source of Object.values(detail.sources)) {
    assert.match(source.url, /^https:\/\//)
    assert.match(source.license, /공공누리|제한 없음|ODbL/)
    assert.match(source.sha256, /^[a-f0-9]{64}$/)
  }
  const samples = [
    ['서울역', '2-1', 11.85], ['시청', '2-1', 10.05], ['시청', '3-2', 19.89],
    ['종로3가', '2-1', 11.24], ['종로3가', '4-3', 20.25], ['공덕', '6-5', 20.29],
    ['공덕', '7-6', 13.38], ['여의도', '6-5', 27.78], ['Sindorim', '3-2', 10.84],
    ['을지로4가', '6-5', 26.51], ['종각', '2-1', 11.43],
  ]
  for (const [station, line, observed] of samples) assert.equal(detail.stations[station]?.[line]?.platformM, observed, `${station}/${line}`)
  assert.equal(detail.stations['공덕']['A'].platformM, null)
  assert.equal(detail.stations['공덕']['K'].platformM, null)
  assert.ok(Object.values(detail.stations).filter((lines) => Object.values(lines).every((entry) => entry.platformM === null)).length > 50)
  for (const station of data.stations) {
    assert.deepEqual(Object.keys(detail.stations[station.id]).sort(), station.lineIds.sort(), station.id)
    for (const entry of Object.values(detail.stations[station.id])) {
      assert.equal(entry.platformM === null, entry.railM === null, station.id)
      assert.equal(entry.platformM !== null, Boolean(entry.sources.depth), station.id)
      if (entry.platformM !== null) assert.ok(entry.platformM > 0 && entry.railM > entry.platformM)
    }
  }
  assert.ok(detail.paths.some((path) => path.kind === 'observed' && path.points.length > 3))
  const edgeKeys = new Set(data.edges.flatMap((edge, index) => edge.lineIds.map((line) => `${index}/${line}`)))
  for (const path of detail.paths) {
    assert.ok(edgeKeys.has(`${path.edge}/${path.lineId}`), `${path.edge}/${path.lineId}`)
    assert.ok(path.points.length >= 2)
    assert.ok(path.points.every(([x, y, depth]) => Number.isFinite(x) && Number.isFinite(y) && (depth === null || Number.isFinite(depth))))
    assert.equal(path.kind === 'observed', path.osmWay !== null)
  }
  const map = await readFile(new URL('../src/components/OpeningTerritoryMap.tsx', import.meta.url), 'utf8')
  assert.match(map, /selectedStation\.memberIds\.map\(\(member\) => underground\?\.stations\[member\]\?\.\[id\]\)/)
  assert.match(map, /presentationStations/)
  assert.match(map, /memberIds/)
  assert.match(map, /selectedLine === 'all' \|\| station\.lineIds\.includes\(selectedLine\)/)
  const aliases = await readFile(new URL('../src/components/stationPresentation.ts', import.meta.url), 'utf8')
  assert.match(aliases, /station\.lineIds\.some\(\(lineId\) => primary\.lineIds\.includes\(lineId\)\)/)
  assert.ok(detail.stations['강변']['3-2'])
  assert.equal(detail.stations['강변(동서울터미널)'], undefined)
})

test('between-station segments are underground units with a rule-derived control and occupation-based 2126 passage', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const ledger = JSON.parse(await readFile(new URL('../lore/places/station-control-overrides.json', import.meta.url), 'utf8'))
  const stationById = new Map(data.stations.map((station) => [station.id, station]))
  const segmentDeltas = new Map((ledger.segmentOverrides ?? []).map((entry) => [entry.segmentId, entry]))
  assert.equal(data.edges.length, 381)
  assert.equal(new Set(data.edges.map((edge) => edge.id)).size, 381)
  for (const edge of data.edges) {
    assert.equal(edge.id, `segment:${edge.a}~${edge.b}`)
    assert.ok(['open', 'checkpoint', 'unknown'].includes(edge.passage2126), edge.id)
    if (edge.passage2126 !== 'unknown' && !ledger.passageDecisions.some((entry) => entry.segmentId === edge.id)) assert.equal(edge.passage2126, edge.control.status === 'held' ? 'open' : 'checkpoint', edge.id)
    assert.ok(['derived-from-stations', 'control-delta'].includes(edge.control?.source), edge.id)
    assert.ok(Object.hasOwn(edge.control, 'deltaId'), edge.id)
    const delta = segmentDeltas.get(edge.id)
    if (delta) {
      assert.equal(edge.control.source, 'control-delta', edge.id)
      assert.deepEqual(edge.control.polityIds, delta.polityIds, edge.id)
      continue
    }
    const a = stationById.get(edge.a).control
    const b = stationById.get(edge.b).control
    const sameHolders = [...a.polityIds].sort().join('|') === [...b.polityIds].sort().join('|')
    if (a.status === 'unknown' || b.status === 'unknown') {
      assert.equal(edge.control.status, 'unknown', edge.id)
      assert.deepEqual(edge.control.polityIds, [], edge.id)
      assert.equal(edge.control.primary, null, edge.id)
    } else if (sameHolders) {
      assert.deepEqual(edge.control.polityIds, a.polityIds, edge.id)
      assert.equal(edge.control.status, a.status, edge.id)
    } else {
      assert.equal(edge.control.status, 'contested', edge.id)
      assert.deepEqual(edge.control.polityIds, [...new Set([...a.polityIds, ...b.polityIds])].sort(), edge.id)
      assert.equal(edge.control.primary, null, edge.id)
    }
  }
  // 소유자 결정(2026-09-28): 개막 시점 모든 역이 점유되어 있으므로 미확인 구간도 없다.
  assert.equal(data.edges.filter((edge) => edge.control.status === 'unknown').length, 0)
  // 소유자 결정(2026-09-28): 한강 횡단 12구간은 구간별 결정을 따른다.
  assert.equal(ledger.passageDecisions.length, 10)
  assert.equal(ledger.retiredPassageDecisions.length, 3)
  for (const decision of ledger.retiredPassageDecisions) assert.equal(data.edges.find((edge) => edge.id === decision.segmentId), undefined)
  for (const decision of ledger.passageDecisions) assert.equal(data.edges.find((edge) => edge.id === decision.segmentId).passage2126, decision.passage2126, decision.segmentId)
  assert.equal(data.edges.find((edge) => edge.id === 'segment:압구정~옥수').passage2126, 'open')
  assert.equal(data.edges.filter((edge) => edge.passage2126 === 'unknown').length, 0)
})

test('surface and underground territory are separate flat views switched explicitly', async () => {
  const map = await readFile(new URL('../src/components/OpeningTerritoryMap.tsx', import.meta.url), 'utf8')
  const css = await readFile(new URL('../src/components/OpeningTerritoryMap.css', import.meta.url), 'utf8')
  assert.match(map, /className="territory-layer-toggle"/)
  assert.match(map, /aria-pressed=\{layer === 'surface'\}[^>]*>지상 영토</)
  assert.match(map, /aria-pressed=\{layer === 'underground'\}[^>]*>지하 영토</)
  assert.match(map, /data-underground-segment=\{edge\.id\}/)
  assert.match(map, /data-station-area=\{station\.id\}/)
  assert.match(map, /미배정/)
  assert.match(map, /2126 통행/)
  assert.match(css, /\.territory-underground-segment/)
  assert.doesNotMatch(css, /territory-underground-levels/)
  assert.doesNotMatch(map, /OrbitControls|data-three-territory-map|undergroundGroup/)
})


test('published current rights contain no outside claims and preserve exact approved Seoul successors', async () => {
  const json = async path => JSON.parse(await readFile(new URL('../' + path, import.meta.url), 'utf8'))
  for (const file of ['outside-admin-units.json', 'outside-control-2126.json']) await assert.rejects(readFile(new URL('../public/' + file, import.meta.url)), { code: 'ENOENT' })
  const control = await json('lore/regions/outside-control-2126.json')
  const holdings = await json('public/confirmed-person-holdings.json')
  const approval = await json('scripts/approved-daejeon-nonowning-rights.json')
  const source = await json('lore/relations/opening-feudal-allocation.json')
  assert.deepEqual(control.assignments, [])
  assert.equal(holdings.summary.heldOutsideUnits, 0)
  assert.deepEqual(holdings.summary, { existingHoldings: 25, newGrants: 31, holdings: 56, titles: 42,
    existingTitleBindings: 7, heldSeoulRegions: 427, heldOutsideUnits: 0, heldComponents: 0, unassignedComponents: 0, coveredEntitlements: 427 })
  for (const row of [...holdings.holdings, ...holdings.titles]) {
    assert.ok((row.adminRefs ?? []).every(ref => /^region:11\d{8}$/.test(ref.id)))
    assert.ok((row.jurisdictionRefs ?? []).every(ref => /^region:11\d{8}$/.test(ref)))
    assert.equal((row.componentRefs ?? []).length, 0)
    assert.notEqual(row.geometrySource, 'outside-admin-units.units')
  }
  const nonowning = holdings.holdings.filter(row => row.kind === 'superior-jurisdiction')
  assert.equal(nonowning.length, 5)
  for (const right of approval.contract.rights) {
    const row = nonowning.find(row => row.id === right.holdingId)
    assert.equal(row.holderPersonId, right.holderPersonId)
    assert.equal(row.directLiegePersonId, right.personalLiegePersonId)
    assert.equal(row.titleId, right.titleId)
    assert.deepEqual(row.geographicScope, right.geographicScope)
    assert.deepEqual(row.powers, approval.powers)
    assert.deepEqual(row.adminRefs, [])
    assert.equal(row.directOwnership, false)
  }
  assert.deepEqual(holdings.titles, source.titles)
  assert.deepEqual(holdings.politicalIdentities, source.politicalIdentities)
  assert.equal(holdings.politicalIdentities.length, 158)
  assert.deepEqual(holdings.polities.map(polity => [polity.id, polity.sovereignPersonId, polity.formalTitle, polity.formalTitleRank, polity.office, polity.territorialScale, polity.directOwnership]),
    [['polity:daejeon', 'K1008', '대전선', '왕격', '대전 군주', null, false]])
  const map = await readFile(new URL('../src/components/OpeningTerritoryMap.tsx', import.meta.url), 'utf8')
  assert.match(map, /territory-mode-toggle/u)
  assert.match(map, /aria-label="서울 정치 권역 범례"/u)
  assert.match(map, /data-title-relation=/u)
  assert.match(map, /data-title-holding-marker=\{holding\.id\}/u)
  assert.match(map, /data-title-rank=/u)
})
