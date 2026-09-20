import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('opening territory map covers every Seoul dong and all sixteen states', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  assert.equal(data.regions.length, 427)
  assert.equal(data.states.length, 16)
  const expectedStates = {
    S01: '급수계약정', S02: '규격동맹', S03: '양재기공주식회사', S04: '기독교',
    S05: '호위보호정', S06: '대한민국정부', S07: '선로후계정', S08: '원불교',
    S09: '여의도출자연합회', S10: '불교', S11: '서초전산그룹', S12: '중립호송시',
    S13: '의약중립맹', S14: '관문군정', S15: '천주교', S16: '정동노동총연맹',
  }
  assert.deepEqual(Object.fromEntries(data.states.map((state) => [state.id, state.name])), expectedStates)
  assert.equal(new Set(data.regions.map((region) => region.id)).size, 427)
  assert.ok(data.regions.every((region) => region.path.length > 0))
  assert.ok(data.regions.every((region) => region.openingState.length > 0))
  assert.ok(data.regions.every((region) => region.polities.length >= 1))
  assert.ok(data.regions.some((region) => region.status === 'contested'))
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
    assert.deepEqual(regions[0].polities, [state.id], `${state.id}:${capital.name}:owner`)
  }
})

test('World and Subway Layers mounts the opening territory map', async () => {
  const page = await readFile(new URL('../src/pages/ArticlePage.tsx', import.meta.url), 'utf8')
  const map = await readFile(new URL('../src/components/OpeningTerritoryMap.tsx', import.meta.url), 'utf8')
  assert.match(page, /World-and-Subway-Layers/)
  assert.match(page, /OpeningTerritoryMap/)
  assert.match(page, /lazy\(\(\) => import\('\.\.\/components\/OpeningTerritoryMap'\)\)/)
  assert.match(page, /<Suspense[^>]*>[\s\S]*<OpeningTerritoryMap \/>[\s\S]*<\/Suspense>\}\s*\n\s*<div className="wiki-article-grid">/)
  assert.match(map, /개막 영토 지도/)
  assert.match(map, /지배 상태/)
  assert.match(map, /427/)
  assert.match(map, /지역 선택/)
  assert.match(map, /territory-state-marker/)
  assert.match(map, /aria-pressed=/)
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
  assert.match(map, /334개 역 점령 정보/)
  assert.match(map, /hoveredStation/)
  assert.match(map, /selectedLine/)
  assert.match(map, /노선 필터/)
  assert.match(map, /지배 계층/)
  assert.match(map, /derived-from-surface/)
  assert.match(map, /Raycaster/)
  const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8')
  assert.match(css, /\.territory-state-markers \{[^}]*z-index: 5/u)
  assert.match(css, /\.territory-station-markers \{[^}]*z-index: 3/u)
  assert.match(css, /\.territory-station-hit-targets \{[^}]*z-index: 4/u)
  assert.match(map, /territory-capital-marker/)
  assert.match(map, /territory-marker-connectors/)
  assert.match(map, /anchorLeft/)
  assert.match(map, /resolveMarkerCollisions/)
  assert.match(map, /capitalStationId/)
  assert.match(map, /수도역/)
  assert.match(map, /data-three-territory-map/)
  assert.match(map, /territory-state-marker/)
  assert.match(map, /<StateFlag/)
  assert.match(map, /드래그 오빗 · 오른쪽 드래그 팬 · 휠 줌/)
  assert.match(map, /줌인/)
  assert.match(map, /줌아웃/)
  assert.match(map, /팬 북쪽/)
  assert.match(map, /pan:/)
  assert.match(map, /zoom:/)
  assert.doesNotMatch(map, /side === 'left'/)
  assert.match(flags, /state-flags\/\$\{normalizedId\}\.webp/)
  assert.doesNotMatch(flags, /<svg|<path|<text/)
  assert.match(map, /state-flags\/concept-sheet\.webp/)
})
