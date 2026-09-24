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
  const titles = ledger.updates.map((entry) => entry.title)

  assert.ok(ledger.updates.length > 5)
  for (const title of [
    '16국 기원 재설계 확정 (대한민국정부·전경련·삼성·현대차·장로회·천주교·조계종·원불교·민주노총)',
    '재벌 수장 항렬 계승 개명 (이홍원·정호준·최지우)',
    '장로회 당회장 오경재 신규 캐스팅',
    'LORE 루트 폴더 재편 완료',
    '문체 계약 락 체결',
  ]) assert.ok(titles.includes(title), title)
  assert.ok(ledger.updates.every((entry) => entry.date && entry.title && entry.category && entry.status && entry.source && entry.route))
  assert.equal(ledger.updates.some((entry) => ['백엔드', '게임플레이', '아트 검증'].includes(entry.category)), false)
  assert.equal(latestUpdates(ledger.updates).length, 5)
  assert.match(home, /wikiUpdates/)
  assert.doesNotMatch(home, /const news =/)
  assert.match(generated, /export const wikiUpdateHistory/)
  assert.match(generated, /export const wikiUpdates/)
})

test('all contract history is routed through the official updates page', async () => {
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const page = await readFile(new URL('../src/pages/UpdatesPage.tsx', import.meta.url), 'utf8')
  const home = await readFile(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')

  assert.match(app, /path="\/updates"/)
  assert.match(page, /wikiUpdateHistory/)
  assert.match(page, /update\.source/)
  assert.match(page, /update\.status/)
  assert.match(home, /전체 계약 이력/)
})

test('reader catalog excludes authoring documents and strips only projection headers', async () => {
  const generator = await readFile(new URL('./generate-catalog.mjs', import.meta.url), 'utf8')
  const contract = JSON.parse(await readFile(new URL('../public/wiki-contract.json', import.meta.url), 'utf8'))
  const names = new Set(contract.documents.map((document) => document.slug))

  for (const slug of ['Cast-Profile-Contract', 'Cast-Registration-Template', 'Random-Cast-Roster']) assert.equal(names.has(slug), false)
  assert.match(generator, /authoring\./)
  assert.match(generator, /stripProjectionHeader/)
  assert.match(generator, /original-fiction/)
})
