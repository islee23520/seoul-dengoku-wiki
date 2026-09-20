import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'

test('document index links every generated canon document', async () => {
  const catalog = await readFile(new URL('../src/generated/wikiCatalog.ts', import.meta.url), 'utf8')
  const page = await readFile(new URL('../src/pages/DocumentsPage.tsx', import.meta.url), 'utf8')
  const routes = [...catalog.matchAll(/route: '([^']+)'/g)].map((match) => match[1])
  const contentRoot = new URL('../src/content/', import.meta.url)
  const generatedCount = (await readdir(new URL('world/', contentRoot))).filter((name) => name.endsWith('.md')).length
  assert.equal(routes.length, generatedCount)
  assert.equal(new Set(routes).size, routes.length)
  assert.ok(routes.every((route) => route.startsWith('/world/')))
  assert.match(page, /wikiCatalog\.length/)
  assert.match(page, /to=\{document\.route\}/)
})

test('home and sidebar expose document and people indexes', async () => {
  const home = await readFile(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')
  const sidebar = await readFile(new URL('../src/components/Sidebar.tsx', import.meta.url), 'utf8')
  for (const source of [home, sidebar]) {
    assert.match(source, /wikiLinks\.documents/)
    assert.match(source, /wikiLinks\.characters/)
  }
})

test('public wiki excludes internal game-design routes', async () => {
  const catalog = await readFile(new URL('../src/generated/wikiCatalog.ts', import.meta.url), 'utf8')
  const links = await readFile(new URL('../src/wikiLinks.ts', import.meta.url), 'utf8')
  const sidebar = await readFile(new URL('../src/components/Sidebar.tsx', import.meta.url), 'utf8')
  for (const source of [catalog, links, sidebar]) {
    assert.doesNotMatch(source, /Online-User-Journey/)
    assert.doesNotMatch(source, /\/design\//)
    assert.doesNotMatch(source, /\/rules\//)
  }
})
