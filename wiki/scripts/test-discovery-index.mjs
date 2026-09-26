import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'

test('document index links every generated canon document', async () => {
  const catalog = await readFile(new URL('../src/generated/wikiCatalog.ts', import.meta.url), 'utf8')
  const page = await readFile(new URL('../src/pages/DocumentsPage.tsx', import.meta.url), 'utf8')
  const routes = [...catalog.matchAll(/route: '([^']+)'/g)].map((match) => match[1])
  const worldRoot = new URL('../src/generated/world/', import.meta.url)
  const generated = (await readdir(worldRoot)).filter((name) => name.endsWith('.json'))
  assert.ok(generated.length > 0)
  assert.equal(routes.length, generated.length)
  assert.equal(new Set(routes).size, routes.length)
  assert.ok(routes.every((route) => route.startsWith('/world/')))
  const generatedRoutes = await Promise.all(generated.map(async (name) => JSON.parse(await readFile(new URL(name, worldRoot), 'utf8')).route))
  assert.deepEqual([...generatedRoutes].sort(), [...routes].sort())
  assert.match(page, /wikiCatalog\.length/)
  assert.match(page, /to=\{document\.route\}/)
})

test('editorial writing rules stay outside generated world and all 83 routes', async () => {
  const rules = await readFile(new URL('../../lore/editorial/Writing-Rules.md', import.meta.url), 'utf8')
  assert.match(rules, /공개 본문과 집필 규칙의 경계/)
  const contract = JSON.parse(await readFile(new URL('../public/wiki-contract.json', import.meta.url), 'utf8'))
  const generated = (await readdir(new URL('../src/generated/world/', import.meta.url))).filter((name) => name.endsWith('.json'))
  assert.equal(contract.documents.length, 83)
  assert.equal(generated.length, 83)
  assert.ok(contract.documents.every(({ route }) => !route.includes('Writing-Rules')))
  assert.ok(!generated.includes('Writing-Rules.json'))
  for (const name of generated) {
    const document = await readFile(new URL(name, new URL('../src/generated/world/', import.meta.url)), 'utf8')
    assert.ok(!document.includes('공개 본문과 집필 규칙의 경계'), name)
  }
})

test('home and sidebar expose document and people indexes', async () => {
  const home = await readFile(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')
  const sidebar = await readFile(new URL('../src/components/Sidebar.tsx', import.meta.url), 'utf8')
  for (const source of [home, sidebar]) {
    assert.match(source, /wikiLinks\.documents/)
    assert.match(source, /wikiLinks\.categories/)
    assert.match(source, /wikiLinks\.characters/)
    assert.match(source, /label: '프롤로그'/)
    assert.doesNotMatch(source, /기동권 이탈/)
  }
})

test('an authored document is indexed from its domain when categories are omitted', async () => {
  const { registeredCategories, loadCategoryRegistry } = await import('./category-registration.mjs')
  const registry = await loadCategoryRegistry(new URL('./category-registry.json', import.meta.url))
  const omitted = { domain: 'places', slug: 'fresh-place', content: [] }
  assert.deepEqual(registeredCategories(omitted, registry), ['places'])
})

test('a registered category lists its document and the index covers projections', async () => {
  const index = await readFile(new URL('../src/generated/categoryIndex.ts', import.meta.url), 'utf8')
  const page = await readFile(new URL('../src/pages/CategoriesPage.tsx', import.meta.url), 'utf8')
  assert.match(index, /"id": "culture"/)
  assert.match(index, /"slug": "Martial-Paths"/)
  assert.match(index, /"id": "overview"/)
  assert.match(index, /"slug": "World-Unbinding"/)
  assert.match(index, /"slug": "Hostile-Group-G01"/)
  assert.match(page, /categoryIndex\.categories/)
  assert.match(page, /to=\{document\.route\}/)
  assert.doesNotMatch(page, /requiredAnchors/)
})
