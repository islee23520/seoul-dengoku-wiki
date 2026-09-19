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
})

test('World and Subway Layers mounts the opening territory map', async () => {
  const page = await readFile(new URL('../src/pages/ArticlePage.tsx', import.meta.url), 'utf8')
  const map = await readFile(new URL('../src/components/OpeningTerritoryMap.tsx', import.meta.url), 'utf8')
  assert.match(page, /World-and-Subway-Layers/)
  assert.match(page, /OpeningTerritoryMap/)
  assert.match(map, /개막 영토 지도/)
  assert.match(map, /지배 상태/)
  assert.match(map, /427/)
  assert.match(map, /role="button"/)
  assert.match(map, /tabIndex=\{0\}/)
  assert.match(map, /event\.key === 'Enter'/)
})
