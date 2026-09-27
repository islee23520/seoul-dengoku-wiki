import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

test('retired world slugs resolve to published documents and preserve fragments', async () => {
  const source = await readFile(new URL('../src/wikiRouting.ts', import.meta.url), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
  const { legacyWorldRoutes, resolveLegacyWorldRoute } = await import(`data:text/javascript,${encodeURIComponent(compiled)}`)
  const catalog = await readFile(new URL('../src/generated/wikiCatalog.ts', import.meta.url), 'utf8')
  const routes = new Set([...catalog.matchAll(/route: '([^']+)'/g)].map((match) => match[1]))
  assert.deepEqual(Object.keys(legacyWorldRoutes).sort(), [
    'Ambitions-and-Relations', 'Conscription-Remnants',
    'Factions-and-Diplomacy', 'Heirs-Names-and-World-Ledger',
  ].sort())
  for (const oldSlug of Object.keys(legacyWorldRoutes)) assert.ok(routes.has(resolveLegacyWorldRoute(oldSlug)), oldSlug)
  const article = await readFile(new URL('../src/pages/ArticlePage.tsx', import.meta.url), 'utf8')
  assert.match(article, /<Navigate to=\{`\$\{legacyRoute\}\$\{hash\}`\} replace \/>/)
})
