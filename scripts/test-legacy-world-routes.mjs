import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'vitest'
import ts from 'typescript'

test('retired world slugs resolve to published documents or registered replacement pages and preserve fragments', async () => {
  const source = await readFile(new URL('../src/wikiRouting.ts', import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
  const { legacyWorldRoutes, resolveLegacyWorldRoute } = await import(`data:text/javascript,${encodeURIComponent(compiled)}`)
  const catalog = await readFile(new URL('../src/generated/wikiCatalog.ts', import.meta.url), 'utf8')
  const routes = new Set([...catalog.matchAll(/route: '([^']+)'/g)].map((match) => match[1]))
  const app = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
  const redirects = new Map([...app.matchAll(/<Route path="([^"]+)" element=\{<Navigate to="([^"]+)" replace \/>\} \/>/g)]
    .map(match => [match[1], match[2]]))
  const pages = new Set([...app.matchAll(/<Route path="([^"]+)" element=\{<(?!Navigate\b|ArticlePage\b|LegacyRegionPage\b)/g)]
    .map(match => match[1]).filter(route => !/[:*]/u.test(route)))
  assert.deepEqual(Object.keys(legacyWorldRoutes).sort(), [
    'Ambitions-and-Relations', 'Conscription-Remnants',
    'Factions-and-Diplomacy', 'Heirs-Names-and-World-Ledger',
  ].sort())
  for (const oldSlug of Object.keys(legacyWorldRoutes)) {
    let destination = resolveLegacyWorldRoute(oldSlug)
    const visited = new Set()
    while (redirects.has(destination)) {
      assert.ok(!visited.has(destination), `redirect cycle: ${oldSlug}`)
      visited.add(destination)
      destination = redirects.get(destination)
    }
    assert.ok(routes.has(destination) || pages.has(destination), `${oldSlug}: ${destination}`)
  }
  const article = await readFile(new URL('../src/pages/ArticlePage.tsx', import.meta.url), 'utf8')
  assert.match(article, /<Navigate to=\{`\$\{legacyRoute\}\$\{hash\}`\} replace \/>/)
})
