import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('timeline overview exposes a causal summary for every year from 2026 through 2126', async () => {
  const data = JSON.parse(await readFile(new URL('../public/timeline-overview.json', import.meta.url), 'utf8'))
  assert.equal(data.years.length, 101)
  assert.deepEqual(data.years.map((entry) => entry.year), Array.from({ length: 101 }, (_, index) => 2026 + index))
  assert.ok(data.years.every((entry) => entry.summary.length >= 40))
  assert.ok(data.years.every((entry) => entry.pressure.length > 0 && entry.decision.length > 0 && entry.aftermath.length > 0))
  assert.ok(data.years.every((entry) => entry.sourceRoute === `/world/Century-Annals#${entry.year}년`))
  assert.ok(data.years.every((entry) => entry.relatedDocuments.length >= 1))
})

test('timeline overview cross-links the current 16 states and world canon', async () => {
  const data = JSON.parse(await readFile(new URL('../public/timeline-overview.json', import.meta.url), 'utf8'))
  const states = data.states
  assert.equal(states.length, 16)
  assert.equal(new Set(states.map((state) => state.name)).size, 16)
  const routes = new Set(data.years.flatMap((entry) => entry.relatedDocuments.map((document) => document.route)))
  for (const route of ['/world/Sixteen-States', '/world/Chaebol-Houses-and-Century-Factions', '/world/Faith-Culture-Schism', '/world/Era-Arms-and-Tech-Level', '/world/External-Theaters']) assert.ok(routes.has(route), route)
})

test('Scenario Timeline mounts the complete timeline overview', async () => {
  const page = await readFile(new URL('../src/pages/ArticlePage.tsx', import.meta.url), 'utf8')
  const component = await readFile(new URL('../src/components/TimelineOverview.tsx', import.meta.url), 'utf8')
  assert.match(page, /Scenario-Timeline/)
  assert.match(page, /TimelineOverview/)
  assert.match(component, /전체 101개 연도/)
  assert.match(component, /재접촉 전야 2115–2126/)
  assert.doesNotMatch(component, /개막 전야/)
  assert.match(component, /timeline-overview-year/)
  assert.match(component, /relatedDocuments/)
})
