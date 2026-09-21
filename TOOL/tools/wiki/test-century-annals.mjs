import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'

export function verifyCenturyAnnals(markdown) {
  const years = [...markdown.matchAll(/^### (\d{4})년$/gm)].map((match) => Number(match[1]))
  const expected = Array.from({ length: 101 }, (_, index) => 2026 + index)
  assert.deepEqual(years, expected)
  for (const year of expected) {
    const body = markdown.split(`### ${year}년\n`)[1]?.split(/^### \d{4}년$/m)[0] ?? ''
    assert.match(body, /(?:^\|[^\n]+\|[^\n]+\|$)|(?:^- [^:]+:)/m, `${year}: structured record missing`)
  }
}

test('2026-2126 century annals contain every year exactly once', async () => {
  verifyCenturyAnnals(await readFile(resolve('LORE/chronology/Century-Annals.md'), 'utf8'))
})

test('removing the opening year is rejected', async () => {
  const markdown = await readFile(resolve('LORE/chronology/Century-Annals.md'), 'utf8')
  assert.throws(() => verifyCenturyAnnals(markdown.replace(/^### 2126년[\s\S]*$/m, '')), assert.AssertionError)
})

test('scenario timeline exposes the century annals, era causality, and all yearly entry links', async () => {
  const timeline = await readFile(resolve('LORE/chronology/Scenario-Timeline.md'), 'utf8')
  assert.match(timeline, /## 백년실록 시대별 총람/)
  assert.match(timeline, /## 2026–2126 연도별 진입/)
  assert.match(timeline, /## 2126년 첫날 동시 사건/)
  for (let year = 2026; year <= 2126; year += 1) {
    assert.match(timeline, new RegExp(`\\[${year}년\\]\\(Century-Annals\\.md#${year}년\\)`), String(year))
  }
  for (const scenario of ['XT01-SC1', 'XT02-SC1', 'XT03-SC1', 'XT04-SC1', 'XT05-SC1']) {
    assert.match(timeline, new RegExp(scenario), scenario)
  }
})
