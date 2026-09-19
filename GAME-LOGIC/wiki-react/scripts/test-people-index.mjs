import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('all canonical people are indexed and linked to a canon card', async () => {
  const catalog = await readFile(new URL('../src/generated/peopleCatalog.ts', import.meta.url), 'utf8')
  const count = Number(catalog.match(/peopleCount = (\d+)/)?.[1])
  const names = [...catalog.matchAll(/"name": "([^"]+)"/g)].map((match) => match[1])
  const routes = [...catalog.matchAll(/"route": "([^"]+)"/g)].map((match) => match[1])
  assert.equal(count, 1004)
  assert.equal(names.length, 1004)
  assert.equal(new Set(names).size, 1004)
  assert.equal(routes.length, 1004)
  assert.ok(routes.every((route) => route.startsWith('/world/') && route.includes('#')))
  assert.equal(routes.filter((route) => route.startsWith('/world/Core-Characters#인물-')).length, 0)
  assert.ok(routes.some((route) => route.startsWith('/world/Core-Characters#윤서린')))
})

test('people search route is linked from wiki navigation', async () => {
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const links = await readFile(new URL('../src/wikiLinks.ts', import.meta.url), 'utf8')
  assert.match(app, /path="\/people"/)
  assert.match(links, /characters: '\/people'/)
})
