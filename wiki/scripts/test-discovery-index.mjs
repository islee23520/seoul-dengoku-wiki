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

test('home and sidebar expose document and people indexes', async () => {
  const home = await readFile(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')
  const sidebar = await readFile(new URL('../src/components/Sidebar.tsx', import.meta.url), 'utf8')
  for (const source of [home, sidebar]) {
    assert.match(source, /wikiLinks\.documents/)
    assert.match(source, /wikiLinks\.characters/)
    assert.match(source, /label: '프롤로그'/)
    assert.doesNotMatch(source, /기동권 이탈/)
  }
})
