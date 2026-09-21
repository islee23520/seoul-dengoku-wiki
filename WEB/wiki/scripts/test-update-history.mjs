import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { latestUpdates } from './update-history.mjs'

test('latest updates sorts newest entries first and returns only five', () => {
  const entries = [
    { date: '2026-09-18', title: '넷째', sequence: 1 },
    { date: '2026-09-19', title: '둘째', sequence: 2 },
    { date: '2026-09-17', title: '여섯째', sequence: 1 },
    { date: '2026-09-19', title: '첫째', sequence: 3 },
    { date: '2026-09-18', title: '다섯째', sequence: 0 },
    { date: '2026-09-19', title: '셋째', sequence: 1 },
  ]

  assert.deepEqual(latestUpdates(entries).map((entry) => entry.title), ['첫째', '둘째', '셋째', '넷째', '다섯째'])
})

test('wiki update ledger contains the five confirmed changes and Home renders generated updates', async () => {
  const ledger = JSON.parse(await readFile(new URL('../data/update-history.json', import.meta.url), 'utf8'))
  const home = await readFile(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')
  const generated = await readFile(new URL('../src/generated/wikiUpdates.ts', import.meta.url), 'utf8')
  const titles = latestUpdates(ledger.updates).map((entry) => entry.title)

  assert.deepEqual(titles, [
    '16국 기원 재설계 확정 (대한민국정부·전경련·삼성·현대차·장로회·천주교·조계종·원불교·민주노총)',
    '재벌 수장 항렬 계승 개명 (이홍원·정호준·최지우)',
    '장로회 당회장 오경재 신규 캐스팅',
    'LORE 루트 폴더 재편 완료',
    '문체 계약 락 체결',
  ])
  assert.match(home, /wikiUpdates/)
  assert.doesNotMatch(home, /const news =/)
  assert.match(generated, /export const wikiUpdates/)
})
