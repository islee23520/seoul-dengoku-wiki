import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'

test('sixteen states expose sixteen unique detail routes', async () => {
  const source = await readFile(new URL('../src/pages/StatesPage.tsx', import.meta.url), 'utf8')
  const catalog = await readFile(new URL('../src/generated/stateCatalog.ts', import.meta.url), 'utf8')
  const slugs = [...catalog.matchAll(/"slug": "([^"]+)"/g)].map((match) => match[1])
  assert.equal(slugs.length, 16)
  assert.equal(new Set(slugs).size, 16)
  assert.match(source, /link:\s*stateRoute\(state\.slug\)/)
})

test('state detail route and page are registered', async () => {
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const detail = await readFile(new URL('../src/pages/StateDetailPage.tsx', import.meta.url), 'utf8')
  assert.match(app, /path="\/states\/:stateSlug"/)
  assert.match(detail, /stateCatalog/)
})

test('state detail reads the same territory and vassal records as the map', async () => {
  const detail = await readFile(new URL('../src/pages/StateDetailPage.tsx', import.meta.url), 'utf8')
  const territory = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  assert.match(detail, /opening-territories\.json/u)
  assert.match(detail, /entry\.suzerain === state\.id/u)
  assert.match(detail, /region\.polities\.includes\(state\.id\)/u)
  assert.match(detail, /details\.chronology\.map/u)
  assert.equal(territory.states.length, 16)
  assert.equal(territory.vassals.length, 13)
  assert.equal(territory.regions.length, 427)
  for (const state of territory.states) {
    assert.ok(state.chronology.length > 0, state.id)
    assert.ok(territory.regions.some((region) => region.polities.includes(state.id)), state.id)
    assert.equal(territory.vassals.some((vassal) => vassal.suzerain === state.id), state.vassals !== '없음', state.id)
  }
})
