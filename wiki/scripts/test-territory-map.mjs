import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
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
  assert.ok(data.regions.every((region) => region.polities.length >= 1 || region.status === 'vacant'))
  assert.ok(data.regions.some((region) => region.status === 'vacant'))
  assert.ok(data.regions.every((region) => ['held', 'contested', 'vacant'].includes(region.status)))
  assert.ok(data.regions.some((region) => region.status === 'held'))
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
    if (regions[0].polities[0] === 'S06') assert.ok(regions[0].polities.includes(state.id), `${state.id}:${capital.name}:context`)
    else assert.deepEqual(regions[0].polities, [state.id], `${state.id}:${capital.name}:owner`)
    assert.deepEqual(capital.control.polityIds, [state.id], `${state.id}:${capital.name}:station`)
    assert.equal(capital.control.status, 'held', `${state.id}:${capital.name}:station-status`)
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
    assert.equal(vassal.coordinateStatus, 'TODO', `outside Seoul coordinate: ${vassal.name}`)
    assert.ok(vassal.anchor.length > 0, `line anchor: ${vassal.name}`)
    assert.ok(data.lines[vassal.lineId], `official line: ${vassal.name}`)
  }
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
  assert.match(map, /역 · 대합실/)
  assert.match(map, /승강장/)
  assert.match(map, /터널/)
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
  assert.match(map, /ExtrudeGeometry/)
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
