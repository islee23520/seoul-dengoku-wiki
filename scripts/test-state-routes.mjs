import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'
import { test, vi } from 'vitest'
import { readCanonicalDocument } from './cast-sqlite/canonical-document.mjs'
import { projectPoliticalCatalog } from './generate-catalog.mjs'

// These CLI-only gates load private release modules, not the catalog projection.
vi.mock('./seoul-census.mjs', () => ({}))
vi.mock('./check-seoul-scope.mjs', () => ({}))

test('political catalog projects current hegemons without a retired polity requirement', () => {
  const { data: { currentAffiliation } } = readCanonicalDocument('lore/factions/Sixteen-States.json')
  const personalHoldings = readCanonicalDocument('lore/relations/personal-holdings.json')

  const catalog = projectPoliticalCatalog(currentAffiliation, personalHoldings)

  assert.deepEqual(catalog, { hegemons: currentAffiliation.hegemons })
})

test('states page renders the actual generated catalogs without reconstructing their memberships', async () => {
  const server = await createServer({
    configFile: false, server: { middlewareMode: true },
    plugins: [react()],
  })
  try {
    const { stateCatalog } = await server.ssrLoadModule('/src/generated/stateCatalog.ts')
    const { politicalCatalog } = await server.ssrLoadModule('/src/generated/politicalCatalog.ts')
    const { default: StatesPage } = await server.ssrLoadModule('/src/pages/StatesPage.tsx')

    const dom = new JSDOM(renderToStaticMarkup(createElement(MemoryRouter, null, createElement(StatesPage))))
    try {
      const document = dom.window.document
      for (const hegemon of politicalCatalog.hegemons) assert.ok(document.querySelector(`section[aria-label="${hegemon.name}"]`))
      const routes = [...document.querySelectorAll('a')].map(link => link.getAttribute('href'))
      for (const state of stateCatalog) assert.ok(routes.includes(`/states/${state.slug}`), state.id)
    } finally { dom.window.close() }
  } finally { await server.close() }
})

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

test('state detail reads Seoul territory and preserves source vassal descriptions without outside selection records', async () => {
  const detail = await readFile(new URL('../src/pages/StateDetailPage.tsx', import.meta.url), 'utf8')
  const territory = JSON.parse(await readFile(new URL('../public/opening-territories.json', import.meta.url), 'utf8'))
  assert.match(detail, /opening-territories\.json/u)
  assert.doesNotMatch(detail, /entry\.suzerain === state\.id/u)
  assert.match(detail, /region\.polities\.includes\(state\.id\)/u)
  assert.match(detail, /details\.chronology\.map/u)
  assert.equal(territory.states.length, 16)
  assert.deepEqual(territory.vassals, [])
  assert.equal(territory.regions.length, 427)
  const stateIds = new Set(territory.states.map(state => state.id))
  assert.equal(stateIds.size, territory.states.length)
  for (const region of territory.regions) {
    for (const polityId of region.polities) assert.ok(stateIds.has(polityId), `${region.id}:${polityId}`)
  }
  for (const state of territory.states) {
    assert.ok(state.chronology.length > 0, state.id)
    assert.equal(typeof state.vassals, 'string', state.id)
  }
})
