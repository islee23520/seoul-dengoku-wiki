import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import test from 'node:test'
import { presentationStations, stationAliases } from '../src/components/stationPresentation.ts'

test('alternate labels share one displayed station while graph nodes and edges remain independent', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const displayed = presentationStations(data.stations)
  assert.equal(data.stations.length, 334)
  assert.equal(data.edges.length, 435)
  assert.equal(Object.keys(stationAliases).length, 18)
  assert.equal(displayed.length, 316)
  for (const [aliasId, primaryId] of Object.entries(stationAliases)) {
    const station = displayed.find((candidate) => candidate.id === primaryId)
    assert.deepEqual(station.memberIds, [primaryId, aliasId], aliasId)
    assert.deepEqual(station.lineIds, [...new Set(station.memberIds.flatMap((id) => data.stations.find((source) => source.id === id).lineIds))], aliasId)
    assert.equal(displayed.some((candidate) => candidate.id === aliasId), false, aliasId)
  }
  assert.deepEqual(displayed.filter((station) => station.name.startsWith('신촌')).map((station) => station.id), ['신촌', '신촌(지하)'])
  assert.ok(data.edges.some((edge) => edge.a === '신촌(지하)' || edge.b === '신촌(지하)'))
})

test('approved landmark roles project to surveyed facilities without changing surrounding dong ownership', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const source = JSON.parse(await readFile(new URL('../../lore/places/landmark-roles.json', import.meta.url), 'utf8'))
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
  assert.equal(data.states.length, 16)
  const expectedStates = {
    S01: '수문국', S02: '규격맹', S03: '태욱그룹', S04: '명부교회',
    S05: '동방사', S06: '대한민국정부', S07: '환적국', S08: '중앙기술보존원',
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
  const contentRoot = new URL('../../lore/regions/content/', import.meta.url)
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
  assert.equal(data.stations.length, 334)
  assert.equal(data.edges.length, 435)
  assert.ok(Object.keys(data.lines).length >= 20)
  assert.ok(data.stations.every((station) => Array.isArray(station.lineIds)))
  assert.ok(data.stations.filter((station) => station.lineIds.length > 0).length >= 330)
  assert.ok(data.edges.every((edge) => Array.isArray(edge.lineIds)))
  assert.ok(data.stations.every((station) => ['derived-from-surface', 'outside-surface-atlas', 'control-delta'].includes(station.control?.source)))
  assert.ok(data.stations.every((station) => Object.hasOwn(station.control, 'deltaId')))
  assert.ok(data.stations.filter((station) => station.control?.source === 'derived-from-surface').length > 300)
  assert.ok(data.stations.filter((station) => station.control?.source === 'outside-surface-atlas').every((station) => station.control.status === 'unknown'))
  assert.ok(data.stations.every((station) => station.control?.hierarchy?.stationManager.endsWith('역장')))
  assert.ok(data.stations.filter((station) => station.control?.source === 'derived-from-surface').every((station) => station.control?.hierarchy?.regionalAuthority.includes('권역 책임자')))
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
    if (state.id === 'S16') {
      assert.deepEqual(capital.control.polityIds, ['S06', 'S16'], 'City Hall shared station')
      assert.equal(capital.control.status, 'contested')
      assert.equal(capital.control.primary, 'S06')
    } else {
      assert.deepEqual(capital.control.polityIds, [state.id], `${state.id}:${capital.name}:station`)
      assert.equal(capital.control.status, 'held', `${state.id}:${capital.name}:station-status`)
      assert.equal(capital.control.primary, state.id)
    }
  }
})

test('the City Hall control ledger separates Government guard priority from the S16 capital and roll', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const ledger = JSON.parse(await readFile(new URL('../../lore/places/station-control-overrides.json', import.meta.url), 'utf8'))
  const cityHall = data.stations.find((station) => station.id === '시청')
  const delta = ledger.overrides.find((entry) => entry.stationId === '시청')
  assert.deepEqual(cityHall.control.polityIds, delta.polityIds)
  assert.equal(cityHall.control.primary, delta.primary)
  assert.equal(cityHall.control.source, 'control-delta')
  assert.equal(cityHall.control.status, 'contested')
  assert.equal(data.states.find((state) => state.id === 'S16').capitalStationId, '시청')
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
    S07: '용산', S08: '흑석', S09: '여의도', S10: '안국', S11: '강남', S12: '신내',
    S13: '제기동', S14: '구의', S15: '명동', S16: '시청',
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
  assert.equal(people.filter((person) => person.stateName === '급수계약정').length, 0)
})

test('thirteen vassals point at valid suzerains outside the sixteen', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const canon = JSON.parse(await readFile(new URL('../../lore/factions/Sixteen-States.json', import.meta.url), 'utf8'))
  const canonVassals = canon.content.find((block) => block.anchor === 'table-2').rows.map((row) => row[0].ko.replace(/\([^)]*\)/gu, '').trim())
  assert.equal(data.vassals.length, 13)
  assert.deepEqual(data.vassals.map((vassal) => vassal.name).sort(), canonVassals.sort())
  const stateIds = new Set(data.states.map((state) => state.id))
  const expectedVassalSuzerains = {
    '경기도': 'S06', '제일수문': 'S01', '제이수문': 'S01', '제1분공방': 'S02', '제2분공방': 'S02',
    '제1종착': 'S07', '제2종착': 'S07', '제1경비지구': 'S05', '제2경비지구': 'S05', '제3경비지구': 'S05',
    '태욱중공업 성남사업장': 'S03', '태욱중공업 수원사업장': 'S03', '영종지점': 'S09',
  }
  assert.deepEqual(Object.fromEntries(data.vassals.map((vassal) => [vassal.name, vassal.suzerain])), expectedVassalSuzerains)
  for (const vassal of data.vassals) {
    assert.ok(stateIds.has(vassal.suzerain), `suzerain must be a state id: ${vassal.name}:${vassal.suzerain}`)
    assert.ok(['S01', 'S02', 'S03', 'S05', 'S06', 'S07', 'S09'].includes(vassal.suzerain), `suzerain must hold vassals: ${vassal.name}:${vassal.suzerain}`)
    assert.ok(vassal.city.length > 0, `city: ${vassal.name}`)
    assert.match(vassal.founded, /^2\d{3}\.\s*\d+\./u, `founded: ${vassal.name}`)
    assert.ok(vassal.duty.length > 0, `duty: ${vassal.name}`)
    assert.equal(vassal.coordinateStatus, 'surveyed', `outside Seoul coordinate: ${vassal.name}`)
    assert.match(vassal.coordinateSource, /vuski\/admdongkor/u)
    assert.ok(Number.isFinite(vassal.east) && Number.isFinite(vassal.north))
    assert.ok(vassal.anchor.length > 0, `line anchor: ${vassal.name}`)
    assert.ok(data.lines[vassal.lineId], `official line: ${vassal.name}`)
  }
})

test('committed terrain covers Seoul and all surveyed vassal centroids with source attribution', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const meta = JSON.parse(await readFile(new URL('../public/regional-terrain.json', import.meta.url), 'utf8'))
  const peninsula = meta.layers.find((layer) => layer.name === 'peninsula')
  const metro = meta.layers.find((layer) => layer.name === 'metro')
  assert.ok(peninsula && metro)
  for (const layer of meta.layers) {
    const bytes = await readFile(new URL(`../public/${layer.file}`, import.meta.url))
    assert.equal(bytes.byteLength, layer.width * layer.height * 4)
    assert.ok(layer.width <= 512 && layer.height <= 512)
  }
  const inside = (layer, east, north) => east >= layer.bboxEPSG5179[0] && east <= layer.bboxEPSG5179[2] && north >= layer.bboxEPSG5179[1] && north <= layer.bboxEPSG5179[3]
  assert.ok(inside(metro, (data.projection.minEast + data.projection.maxEast) / 2, (data.projection.minNorth + data.projection.maxNorth) / 2))
  for (const vassal of data.vassals) {
    assert.ok(inside(metro, vassal.east, vassal.north), `${vassal.city} inside metro terrain`)
    assert.ok(inside(peninsula, vassal.east, vassal.north), `${vassal.city} inside peninsula terrain`)
  }
  assert.match(meta.attribution, /Mapzen Terrain Tiles/u)
  assert.match(meta.attribution, /vuski\/admdongkor CC BY 4\.0/u)
  assert.match(meta.attribution, /OpenStreetMap contributors ODbL/u)
  const rail = JSON.parse(await readFile(new URL('../public/regional-rail.json', import.meta.url), 'utf8'))
  const stationNames = new Set(rail.stations.map((station) => station.name))
  for (const name of ['신창', '연천', '춘천', '문산', '지평', '오이도', '석남', '인천공항2터미널', '광교', '원시']) assert.ok(stationNames.has(name), `regional station: ${name}`)
  for (const lineId of ['2-1', '3-2', '4-3', '5-4', '6-5', '7-6', '8-7', '9-8', '10-9', 'A', 'B', 'E', 'G', 'I', 'I2', 'K', 'KK', 'KP', 'S', 'SH', 'SL', 'U', 'W', '1-GA']) assert.ok(rail.paths.some((path) => path.lineId === lineId), `regional line: ${lineId}`)
})

test('northern rail preserves pinned OSM geometry and unknown passage independently of southern metro', async () => {
  const north = JSON.parse(await readFile(new URL('../public/northern-rail.json', import.meta.url), 'utf8'))
  const south = JSON.parse(await readFile(new URL('../public/regional-rail.json', import.meta.url), 'utf8'))
  assert.equal(south.paths.length, 2863)
  assert.equal(south.stations.length, 739)
  assert.equal(north.source.sha256, '9bb18639a4f35c5ff41404a1a2faa5fd205be960fb5143ed19342a9c1dc16db0')
  assert.equal(north.source.snapshot, '2026-09-24T20:21:20Z')
  assert.match(north.source.license, /ODbL/)
  assert.equal(north.projection, 'EPSG:5179')
  assert.equal(north.paths.length, Object.values(north.coverage.modes).reduce((sum, count) => sum + count, 0))
  assert.equal(new Set(north.paths.map((path) => path.osmWay)).size, north.paths.length)
  assert.equal(new Set(north.stations.map((station) => station.osmNode)).size, north.stations.length)
  assert.equal(north.stations.length, 809)
  assert.equal(north.coverage.counts.unnamedPointStations, north.stations.filter((station) => !station.name).length)
  assert.equal(north.coverage.missingNorthernBoundariesInRenderedLayer, true)
  assert.ok(north.paths.every((path) => path.points.length >= 2 && ['rail', 'narrow_gauge', 'tram', 'subway', 'light_rail', 'monorail', 'funicular'].includes(path.mode) && path.passage2126 === 'unknown'))
  assert.ok(north.stations.every((station) => ['station', 'halt'].includes(station.mode) && station.passage2126 === 'unknown'))
  assert.ok(north.paths.some((path) => path.points.some(([, y]) => y > 2100000)))
  const map = await readFile(new URL('../src/components/OpeningTerritoryMap.tsx', import.meta.url), 'utf8')
  assert.match(map, /asset\('northern-rail\.json'\)/)
  assert.match(map, /regional\.northernRail\.paths/)
  assert.match(map, /regional\.northernRail\.stations/)
})

test('government relations come from the canon table and use only defined terms or null', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const canon = JSON.parse(await readFile(new URL('../../lore/factions/Sixteen-States.json', import.meta.url), 'utf8'))
  const relations = new Map(canon.content.find((block) => block.anchor === 'table-gov-relations').rows.map((row) => [row[0].ko, row[1].ko]))
  for (const state of data.states) {
    assert.ok(state.relation === null || ['복속', '보좌', '독립'].includes(state.relation), state.id)
    assert.equal(state.relation, relations.get(state.name) ?? null, state.id)
  }
})

test('World and Subway Layers mounts the opening territory map', async () => {
  const page = await readFile(new URL('../src/pages/ArticlePage.tsx', import.meta.url), 'utf8')
  const map = await readFile(new URL('../src/components/OpeningTerritoryMap.tsx', import.meta.url), 'utf8')
  assert.match(page, /World-and-Subway-Layers/)
  assert.match(page, /OpeningTerritoryMap/)
  assert.match(page, /lazy\(\(\) => import\('\.\.\/components\/OpeningTerritoryMap'\)\)/)
  assert.match(page, /<Suspense[^>]*>[\s\S]*<OpeningTerritoryMap \/>[\s\S]*<\/Suspense>\}\s*\n\s*<div className="wiki-article-grid">/)
  assert.match(map, /2126 시점 영토 지도/)
  assert.doesNotMatch(map, /개막 영토 지도/)
  assert.match(map, /지배 상태/)
  assert.match(map, /427/)
  assert.match(map, /지역 선택/)
  assert.match(map, /territory-state-marker/)
  assert.match(map, /aria-pressed=/)
})

test('territory map offers surface and subway layers with vassal ring and tier legend', async () => {
  const map = await readFile(new URL('../src/components/OpeningTerritoryMap.tsx', import.meta.url), 'utf8')
  const flags = await readFile(new URL('../src/components/StateFlag.tsx', import.meta.url), 'utf8')
  assert.match(map, /지상/)
  assert.match(map, /지하/)
  assert.match(map, /territory-layer-toggle/)
  assert.match(map, /territory-layer-overlay/)
  assert.match(map, /undergroundLevels/)
  assert.match(map, /실측 심도/)
  assert.match(map, /승강장/)
  assert.match(map, /회색 점선: 심도 또는 선형 미상/)
  assert.match(map, /territory-underground-levels/)
  assert.match(map, /aria-pressed=\{layer ===/)
  assert.match(map, /territory-vassal-markers/)
  assert.match(map, /territory-vassal-marker/)
  assert.match(map, /territory-vassal-inset/)
  assert.match(map, /territory-vassal-label/)
  assert.doesNotMatch(map, /territory-vassal-connector/)
  assert.match(map, /territory-state-swatch/)
  assert.match(map, /속국/)
  assert.match(map, /territory-tier-legend/)
  assert.match(map, /강국/)
  assert.match(map, /약국/)
  assert.match(map, /소국/)
  assert.match(flags, /onError/)
})

test('territory map is a real Three.js scene with state labels and flags', async () => {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
  const map = await readFile(new URL('../src/components/OpeningTerritoryMap.tsx', import.meta.url), 'utf8')
  const flags = await readFile(new URL('../src/components/StateFlag.tsx', import.meta.url), 'utf8')
  assert.equal(packageJson.dependencies.three, '0.186.0')
  assert.match(map, /from 'three'/)
  assert.match(map, /OrbitControls/)
  assert.match(map, /ShapeGeometry/)
  assert.match(map, /Raycaster/)
  assert.match(map, /LineSegments/)
  assert.match(map, /territory-station-marker/)
  assert.match(map, /territory-station-tooltip/)
  assert.match(map, /territory-station-hit/)
  assert.match(map, /역 점령 정보/)
  assert.match(map, /hoveredStation/)
  assert.match(map, /selectedLine/)
  assert.match(map, /노선 필터/)
  assert.match(map, /지배 계층/)
  assert.match(map, /derived-from-surface/)
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8')
  assert.match(css, /\.territory-state-markers \{[^}]*z-index: 5/u)
  assert.match(css, /\.territory-station-markers \{[^}]*z-index: 3/u)
  assert.match(css, /\.territory-station-hit-targets \{[^}]*z-index: 4/u)
  assert.match(map, /territory-capital-marker/)
  assert.doesNotMatch(map, /territory-marker-connectors/)
  assert.match(map, /anchorLeft/)
  assert.match(map, /resolveMarkerCollisions/)
  assert.match(map, /capitalStationId/)
  assert.match(map, /수도역/)
  assert.match(map, /data-three-territory-map/)
  assert.match(map, /territory-state-marker/)
  assert.match(map, /<StateFlag/)
  assert.match(map, /왼쪽 드래그 팬 · 오른쪽 드래그 오빗 · 휠 줌/)
  assert.match(map, /줌인/)
  assert.match(map, /줌아웃/)
  assert.match(map, /팬 북쪽/)
  assert.match(map, /오빗 왼쪽/)
  assert.match(map, /오빗 오른쪽/)
  assert.match(map, /pan:/)
  assert.match(map, /orbit:/)
  assert.match(map, /zoom:/)
  assert.match(map, /vector\.x >= -1 && vector\.x <= 1/)
  assert.match(map, /vector\.y >= -1 && vector\.y <= 1/)
  assert.doesNotMatch(map, /국가 필터와 정본 링크는 아래 범례/)
  assert.doesNotMatch(map, /side === 'left'/)
  assert.match(flags, /state-flags\/\$\{normalizedId\}\.webp\?v=20260920-1/)
  assert.doesNotMatch(flags, /<svg|<path|<text/)
  assert.match(map, /state-flags\/concept-sheet\.webp/)
})

test('territory generator reads states, capitals and vassals from current lore canon', async () => {
  const generator = await readFile(new URL('./generate-catalog.mjs', import.meta.url), 'utf8')
  assert.match(generator, /lore\/factions\/Sixteen-States\.md/)
  assert.doesNotMatch(generator, /WEB\/lore\/factions\/Sixteen-States\.md/)
  assert.match(generator, /stateIdByName/)
  assert.match(generator, /vassalsTableMatch|속국 \| 본국/)
  assert.match(generator, /anchorRules/)
  assert.doesNotMatch(generator, /Chaebol-Houses-and-Century-Factions\.md/)
})

test('selecting a state also selects its capital region and shows state information', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  const map = await readFile(new URL('../src/components/OpeningTerritoryMap.tsx', import.meta.url), 'utf8')

  assert.ok(data.states.every((state) => typeof state.capitalRegionId === 'string' && state.capitalRegionId.length > 0))
  assert.ok(data.states.every((state) => state.origin.length > 0 && state.government.length > 0 && state.ruler.length > 0 && state.cause.length > 0))
  assert.match(map, /selectState/)
  assert.match(map, /setSelectedId\(state\.capitalRegionId\)/)
  assert.match(map, /selected-region-title/)
  assert.match(map, /selected-state-title/)
  assert.match(map, /selectedState\.origin/)
  assert.match(map, /selectedState\.government/)
  assert.match(map, /selectedState\.ruler/)
  assert.match(map, /selectedState\.cause/)
})

test('mouse controls use left drag for pan, right drag for orbit, and wheel zoom', async () => {
  const map = await readFile(new URL('../src/components/OpeningTerritoryMap.tsx', import.meta.url), 'utf8')

  assert.match(map, /controls\.mouseButtons\.LEFT = THREE\.MOUSE\.PAN/)
  assert.match(map, /controls\.mouseButtons\.RIGHT = THREE\.MOUSE\.ROTATE/)
  assert.match(map, /onContextMenu=\{\(event\) => event\.preventDefault\(\)\}/)
  assert.doesNotMatch(map, /controls\.enableZoom = false/)
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
    ['서울', '2-1', 11.85], ['시청', '2-1', 10.05], ['시청', '3-2', 19.89],
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
  assert.match(map, /station\.memberIds\.map\(\(id\) => underground\.stations\[id\]\?\.\[lineId\]\)/)
  assert.match(map, /displayStations/)
  assert.match(map, /memberIds/)
  assert.match(map, /selectedLine === 'all' \|\| lineId === selectedLine/)
  const aliases = await readFile(new URL('../src/components/stationPresentation.ts', import.meta.url), 'utf8')
  assert.match(aliases, /station\.lineIds\.some\(\(lineId\) => primary\.lineIds\.includes\(lineId\)\)/)
  assert.ok(detail.stations['강변']['3-2'])
  assert.ok(detail.stations['강변(동서울터미널)']['3-2'])
})
