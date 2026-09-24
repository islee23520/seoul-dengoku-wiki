import { readFile, readdir, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = await readFile(resolve(root, 'src/wikiLinks.ts'), 'utf8')
const paths = [...source.matchAll(/:\s*'([^']+)'/g)].map((match) => match[1])
const spaRoutes = new Set(['/', '/states', '/documents', '/people', '/updates'])
const catalogSource = await readFile(resolve(root, 'src/generated/wikiCatalog.ts'), 'utf8')
const catalogRoutes = new Set([...catalogSource.matchAll(/route: '([^']+)'/g)].map((match) => match[1]))

const failures = []
for (const path of paths) {
  if (path.startsWith('http') || spaRoutes.has(path) || catalogRoutes.has(path)) continue
  const route = path.replace(/\/$/, '')
  const page = route === '' ? 'index.html' : `${route.replace(/^\//, '')}.html`
  const candidates = [
    resolve(root, 'dist', page),
    resolve(root, 'dist', route.replace(/^\//, ''), 'index.html'),
  ]
  let found = false
  for (const candidate of candidates) {
    try {
      found = (await stat(candidate)).isFile()
      if (found) break
    } catch {}
  }
  if (!found) failures.push(path)
}

const componentSources = await Promise.all([
  'src/pages/HomePage.tsx',
  'src/pages/StatesPage.tsx',
  'src/pages/ArticlePage.tsx',
  'src/components/Sidebar.tsx',
  'src/components/NavBox.tsx',
  'src/components/SortableTable.tsx',
  'src/components/InfoBox.tsx',
].map((path) => readFile(resolve(root, path), 'utf8')))

if (componentSources.some((text) => /(?:href|to|link):?\s*=?(?:\{|)\s*['"]#['"]/.test(text))) {
  failures.push('placeholder # link')
}

if (failures.length) {
  console.error(`WIKI_LINK_GATE_FAIL: ${failures.join(', ')}`)
  process.exit(1)
}

console.log(`WIKI_LINK_GATE_PASS: ${paths.length} registered paths`)
