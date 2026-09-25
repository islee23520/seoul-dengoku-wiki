import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import test from 'node:test'
import { approvedRoutes, catalogFields, readerFields, unknownFields } from './catalog-admission.mjs'

const wikiRoot = resolve(import.meta.dirname, '..')
const loreRoot = resolve(process.env.WIKI_LORE_ROOT ?? resolve(wikiRoot, '../lore'))
const worldRoot = resolve(wikiRoot, 'src/generated/world')

test('the generated catalog admits exactly the current lore publish set', async () => {
  const expected = await approvedRoutes(loreRoot)
  const source = await readFile(resolve(wikiRoot, 'src/generated/wikiCatalog.ts'), 'utf8')
  const catalog = [...source.matchAll(/route: '([^']+)'/g)].map((match) => match[1]).sort()
  const manifest = JSON.parse(await readFile(resolve(wikiRoot, 'public/wiki-contract.json'), 'utf8'))
  const pageNames = (await readdir(worldRoot)).filter((name) => name.endsWith('.json'))
  const pages = await Promise.all(pageNames.map(async (name) => JSON.parse(await readFile(resolve(worldRoot, name), 'utf8'))))

  assert.ok(expected.length > 0)
  assert.deepEqual(catalog, expected)
  assert.deepEqual(Object.keys(manifest), ['documents'])
  assert.deepEqual(manifest.documents.map((document) => document.route).sort(), expected)
  assert.deepEqual(pages.map((page) => page.route).sort(), expected)
  assert.equal(new Set(expected).size, expected.length)
  for (const document of manifest.documents) assert.deepEqual(unknownFields(document, catalogFields), [], document.route)
  for (const [index, page] of pages.entries()) {
    assert.deepEqual(unknownFields(page, readerFields), [], pageNames[index])
    assert.equal(page.slug, basename(pageNames[index], '.json'))
  }
})

test('unknown public fields are rejected', () => {
  assert.deepEqual(unknownFields({ slug: 'index', title: '세계관', route: '/world/', reviewText: '', blocks: [], authoringRule: 'private' }, readerFields), ['authoringRule'])
  assert.deepEqual(unknownFields({ domain: 'world', slug: 'index', route: '/world/', title: '세계관', sourcePath: 'lore/index' }, catalogFields), ['sourcePath'])
})
