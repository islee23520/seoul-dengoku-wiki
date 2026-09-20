import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('opening territory map covers every Seoul dong and all sixteen states', async () => {
  const data = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  assert.equal(data.regions.length, 427)
  assert.equal(data.states.length, 16)
  const expectedStates = {
    S01: '급수계약정', S02: '규격동맹', S03: '현대자동차주식회사', S04: '대한예수교장로회',
    S05: '호위보호정', S06: '대한민국정부', S07: '선로후계정', S08: '원불교',
    S09: '전국경제인연합회', S10: '대한불교조계종', S11: '삼성그룹', S12: '중립호송시',
    S13: '의약중립맹', S14: '관문군정', S15: '천주교 서울대교구', S16: '전국민주노동조합총연맹',
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
  assert.match(map, /data-three-territory-map/)
  assert.match(map, /territory-state-marker/)
  assert.match(map, /<StateFlag/)
  assert.match(map, /팬 · 오빗 · 줌/)
  const flagIds = [...flags.matchAll(/S(?:0[1-9]|1[0-6]):/g)].map((match) => match[0])
  assert.equal(flagIds.length, 16)
  assert.equal(new Set(flagIds).size, 16)
  assert.doesNotMatch(flags, /<text|logo|태극|십자가|무궁화/)
})
