import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

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
