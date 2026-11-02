import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { parse } from '@babel/parser'
import { validatePublicationManifest } from '../doc-publishing/publication-manifest.mjs'

const staticString = (node) => node?.type === 'StringLiteral' ? node.value
  : node?.type === 'TemplateLiteral' && node.expressions.length === 0 ? node.quasis[0].value.cooked : undefined

function staticValue(node) {
  const text = staticString(node)
  if (text !== undefined) return text
  if (['NumericLiteral', 'BooleanLiteral'].includes(node.type)) return node.value
  if (node.type === 'NullLiteral') return null
  if (node.type === 'ArrayExpression') return node.elements.map(staticValue)
  // The minifier compresses literal string arrays to `a,b`.split(`,`).
  // Interpret only this closed literal operation; never call shipped code.
  if (node.type === 'CallExpression' && node.callee.type === 'MemberExpression' && !node.callee.computed
    && node.callee.property.name === 'split' && node.arguments.length === 1) {
    const value = staticString(node.callee.object), separator = staticString(node.arguments[0])
    assert.ok(value !== undefined && separator !== undefined, 'nonliteral bundled category data')
    return value.split(separator)
  }
  assert.equal(node.type, 'ObjectExpression', 'nonliteral bundled category data')
  return Object.fromEntries(node.properties.map((property) => {
    assert.ok(property.type === 'ObjectProperty' && !property.computed, 'nonliteral bundled category property')
    return [property.key.name ?? staticString(property.key), staticValue(property.value)]
  }))
}

async function shippedModules(entryPath, site) {
  const modules = new Map(), catalogs = []
  const visit = async (path) => {
    if (modules.has(path)) return
    const source = await readFile(path, 'utf8')
    modules.set(path, source)
    let ast
    try { ast = parse(source, { sourceType: 'module' }) }
    catch { assert.fail(`${site}: bundled category catalog missing (invalid shipped module)`) }
    const imports = []
    const walk = (node) => {
      if (!node || typeof node !== 'object') return
      if (['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration', 'ImportExpression'].includes(node.type) && node.source) imports.push(staticString(node.source))
      if (node.type === 'CallExpression' && node.callee.type === 'Import') imports.push(staticString(node.arguments[0]))
      if (node.type === 'ObjectExpression') {
        const keys = node.properties.map((property) => property.key?.name ?? staticString(property.key))
        if (keys.includes('categories') && keys.includes(site === 'wiki' ? 'uncategorized' : 'schemaVersion')) catalogs.push(staticValue(node).categories)
      }
      for (const [key, value] of Object.entries(node)) {
        if (['loc', 'start', 'end', 'extra', 'comments'].includes(key)) continue
        if (Array.isArray(value)) value.forEach(walk)
        else if (value && typeof value === 'object') walk(value)
      }
    }
    walk(ast.program)
    for (const name of imports) if (name?.startsWith('.') && name.endsWith('.js')) await visit(resolve(dirname(path), name))
  }
  await visit(entryPath)
  assert.equal(catalogs.length, 1, `${site}: bundled category catalog missing or ambiguous`)
  return { categories: catalogs[0], source: [...modules.values()].join('\n') }
}

export async function verifyPublicationBundles(root, publishedSites = ['wiki', 'gdd']) {
  const sites = [
    { id: 'wiki', manifest: 'WIKI/src/generated/publication-manifest.json', catalog: 'WIKI/src/generated/wikiCatalog.ts', bundle: 'WIKI/dist/assets' },
    { id: 'gdd', manifest: 'GDD/viewer/src/generated/publication-manifest.json', catalog: 'GDD/viewer/src/generated/gddCatalog.ts', bundle: 'GDD/viewer/dist/assets' },
  ]
  assert.ok(publishedSites.length && publishedSites.every((id) => sites.some((site) => site.id === id)), 'unknown publication site')
  for (const site of sites.filter(({ id }) => publishedSites.includes(id))) {
    const manifest = JSON.parse(await readFile(resolve(root, site.manifest), 'utf8'))
    assert.equal(manifest.site, site.id)
    validatePublicationManifest(manifest, manifest.documents)
    const catalog = await readFile(resolve(root, site.catalog), 'utf8')
    // The wiki catalog file also exports wikiEnglishCatalog: English pages of published Korean documents.
    // The manifest lists each document once, under its Korean route.
    const wikiRoutesIn = (source) => [...source.matchAll(/route: '([^']+)'/g)].map((match) => match[1])
    const englishStart = site.id === 'wiki' ? catalog.indexOf('export const wikiEnglishCatalog') : -1
    const routes = site.id === 'wiki'
      ? wikiRoutesIn(englishStart >= 0 ? catalog.slice(0, englishStart) : catalog)
      : JSON.parse(catalog.split('export const gddCatalog = ')[1].split(' as const')[0]).map(({ route }) => route)
    const englishRoutes = englishStart >= 0 ? wikiRoutesIn(catalog.slice(englishStart)) : []
    assert.deepEqual([...routes].sort(), manifest.documents.map(({ route }) => route).sort(), `${site.id}: catalog routes`)
    const publishedRoutes = new Set(routes)
    assert.equal(new Set(englishRoutes).size, englishRoutes.length, `${site.id}: duplicate English route`)
    for (const route of englishRoutes) {
      assert.ok(route.startsWith('/en/') && publishedRoutes.has(route.slice('/en'.length)), `${site.id}: English route without a published document ${route}`)
    }
    const bundled = (await readdir(resolve(root, site.bundle))).filter((name) => /^index-.*\.js$/.test(name))
    assert.equal(bundled.length, 1, `${site.id}: entry bundle`)
    const { categories: bundledCategories, source: entry } = await shippedModules(resolve(root, site.bundle, bundled[0]), site.id)
    assert.equal(bundledCategories.length, manifest.categories.length, `${site.id}: category count`)
    const idsByRoute = new Map(manifest.documents.map(({ route, id }) => [route, id]))
    for (const category of manifest.categories) {
      const actual = bundledCategories.find(({ id }) => id === category.id)
      assert.ok(actual, `${site.id}: missing category ${category.id}`)
      const documentIds = site.id === 'wiki'
        ? actual.documents.map(({ route }) => idsByRoute.get(route))
        : actual.documentIds
      assert.deepEqual([...documentIds].sort(), [...category.documentIds].sort(), `${site.id}: category membership ${category.id}`)
    }
    assert.ok(entry.includes(site.id === 'wiki' ? '/categories/${' : '/documents?category='), `${site.id}: category navigation`)
    for (const route of routes) assert.ok(entry.includes(route), `${site.id}: missing route ${route}`)
  }
  return true
}

if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  await verifyPublicationBundles(resolve(process.argv[2] ?? '.'), process.argv[3] ? [process.argv[3]] : undefined)
  console.log('PUBLICATION_BUNDLE_GATE_PASS')
}
