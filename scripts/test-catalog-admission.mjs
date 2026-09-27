import assert from 'node:assert/strict'
import { access, copyFile, mkdir, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, resolve } from 'node:path'
import test from 'node:test'
import { approvedDocuments, catalogFields, readerFields, unknownFields } from './catalog-admission.mjs'
import { loadCategoryRegistry, registeredCategories, registrationErrors } from './category-registration.mjs'
import { validatePublicationManifest, wikiPublicationManifest } from './publication-manifest.mjs'

const wikiRoot = resolve(import.meta.dirname, '..')
const loreRoot = resolve(process.env.WIKI_LORE_ROOT ?? resolve(wikiRoot, 'lore'))
const worldRoot = resolve(wikiRoot, 'src/generated/world')
const englishWorldRoot = resolve(wikiRoot, 'src/generated/world-en')

test('the generated catalog admits exactly the current lore publish set', async () => {
  const approved = await approvedDocuments(loreRoot)
  const expected = approved.map(({ route }) => route)
  const expectedEnglish = approved.filter(({ source }) => source.endsWith('.json')).map(({ route }) => `/en${route}`)
  const source = await readFile(resolve(wikiRoot, 'src/generated/wikiCatalog.ts'), 'utf8')
  const englishStart = source.indexOf('export const wikiEnglishCatalog')
  assert.ok(englishStart > 0)
  const routesIn = (catalog) => [...catalog.matchAll(/route: '([^']+)'/g)].map((match) => match[1]).sort()
  const catalog = routesIn(source.slice(0, englishStart))
  const englishCatalog = routesIn(source.slice(englishStart))
  const manifest = JSON.parse(await readFile(resolve(wikiRoot, 'public/wiki-contract.json'), 'utf8'))
  const pageNames = (await readdir(worldRoot)).filter((name) => name.endsWith('.json'))
  const pages = await Promise.all(pageNames.map(async (name) => JSON.parse(await readFile(resolve(worldRoot, name), 'utf8'))))
  const englishPageNames = (await readdir(englishWorldRoot)).filter((name) => name.endsWith('.json'))
  const englishPages = await Promise.all(englishPageNames.map(async (name) => JSON.parse(await readFile(resolve(englishWorldRoot, name), 'utf8'))))

  assert.ok(expected.length > 0)
  assert.ok(expectedEnglish.length > 0)
  assert.deepEqual(catalog, expected)
  assert.deepEqual(englishCatalog, expectedEnglish)
  assert.deepEqual(Object.keys(manifest), ['documents', 'englishDocuments'])
  assert.deepEqual(manifest.documents.map((document) => document.route).sort(), expected)
  assert.deepEqual(manifest.englishDocuments.map((document) => document.route).sort(), expectedEnglish)
  assert.deepEqual(pages.map((page) => page.route).sort(), expected)
  assert.deepEqual(englishPages.map((page) => page.route).sort(), expectedEnglish)
  assert.equal(new Set(expected).size, expected.length)
  assert.equal(new Set(expectedEnglish).size, expectedEnglish.length)
  for (const document of manifest.documents) assert.deepEqual(unknownFields(document, catalogFields), [], document.route)
  for (const document of manifest.englishDocuments) assert.deepEqual(unknownFields(document, catalogFields), [], document.route)
  for (const [index, page] of pages.entries()) {
    assert.deepEqual(unknownFields(page, readerFields), [], pageNames[index])
    assert.equal(page.slug, basename(pageNames[index], '.json'))
  }
  for (const [index, page] of englishPages.entries()) {
    assert.deepEqual(unknownFields(page, readerFields), [], englishPageNames[index])
    assert.equal(page.slug, basename(englishPageNames[index], '.json'))
  }
})

test('unknown public fields are rejected', () => {
  assert.deepEqual(unknownFields({ slug: 'index', title: '세계관', route: '/world/', reviewText: '', blocks: [], authoringRule: 'private' }, readerFields), ['authoringRule'])
  assert.deepEqual(unknownFields({ domain: 'world', slug: 'index', route: '/world/', title: '세계관', sourcePath: 'lore/index' }, catalogFields), ['sourcePath'])
})

test('the private naming ledger stays outside the published catalog', async () => {
  const manifest = JSON.parse(await readFile(resolve(wikiRoot, 'public/wiki-contract.json'), 'utf8'))
  const pageNames = await readdir(worldRoot)
  assert.ok(!manifest.documents.some((document) => /editorial|Naming-Ledger/i.test(document.route)))
  assert.ok(!pageNames.some((name) => /Naming-Ledger|Writing-Rules/i.test(name)))
})

test('the publication manifest matches admitted identities, generated readers and category membership', async () => {
  const manifest = JSON.parse(await readFile(resolve(wikiRoot, 'src/generated/publication-manifest.json'), 'utf8'))
  const expected = await approvedDocuments(loreRoot)
  validatePublicationManifest(manifest, expected)
  assert.equal(manifest.site, 'wiki')
  assert.deepEqual(manifest.documents.map(({ source, id, route }) => ({ source, id, route })), expected)
  const registry = await loadCategoryRegistry(new URL('./category-registry.json', import.meta.url))
  assert.deepEqual(manifest.categories.map(({ id, label }) => ({ id, label })), registry.categories.map(({ id, label }) => ({ id, label })))
  const indexSource = await readFile(resolve(wikiRoot, 'src/generated/categoryIndex.ts'), 'utf8')
  const index = JSON.parse(indexSource.split('export const categoryIndex = ')[1].split(' as const satisfies')[0])
  for (const category of manifest.categories) {
    const routes = manifest.documents.filter(({ id }) => category.documentIds.includes(id)).map(({ route }) => route).sort()
    assert.deepEqual(routes, index.categories.find(({ id }) => id === category.id).documents.map(({ route }) => route).sort())
  }
  for (const document of manifest.documents) {
    await access(resolve(wikiRoot, document.source))
    const page = JSON.parse(await readFile(resolve(wikiRoot, document.contentRef), 'utf8'))
    assert.equal(page.route, document.route)
    assert.equal(page.title, document.title)
  }
})

test('a new draft JSON fixture registers while private and non-document fixtures stay excluded', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'wiki-publication-'))
  for (const name of ['World-Narrative-Atlas.md', 'Glossary.md']) await copyFile(resolve(loreRoot, name), resolve(root, name))
  const page = {
    id: 'DOC:Added', domain: 'culture', status: 'draft',
    locales: { ko: { title: '추가 문서', summary: '요약' }, en: { title: 'Added', summary: 'Summary' } },
    source: { kind: 'original-fiction', refs: ['lore/culture/Added.md'] },
    content: [{ kind: 'heading' }, { kind: 'paragraph' }],
  }
  for (const directory of ['culture', 'editorial', 'sources', 'name-pools', 'regions']) await mkdir(resolve(root, directory))
  for (const name of ['culture/Added.json', 'editorial/Hidden.json', 'sources/Hidden.json', 'name-pools/Hidden.json', 'regions/Hidden.json', 'culture/authoring.Hidden.json']) {
    await writeFile(resolve(root, name), JSON.stringify(page))
  }
  await writeFile(resolve(root, 'culture/Dataset.json'), JSON.stringify({ records: [] }))
  const admitted = await approvedDocuments(root)
  assert.ok(!admitted.some(({ route }) => /Hidden|Dataset/.test(route)))
  assert.ok(admitted.some(({ source, id, route }) => source === 'lore/culture/Added.json' && id === page.id && route === '/world/Added'))
  const registry = await loadCategoryRegistry(new URL('./category-registry.json', import.meta.url))
  assert.deepEqual(registrationErrors(page, registry), [])
  const documents = admitted.map(({ id, route }) => ({
    slug: route.split('/').at(-1) || 'index', title: id, summary: '', route,
    categories: route === '/world/Added' ? registeredCategories(page, registry) : ['overview'],
  }))
  const manifest = await wikiPublicationManifest({ loreRoot: root, documents, registry })
  assert.deepEqual(manifest.documents.find(({ id }) => id === page.id).categoryIds, ['culture'])
  assert.equal(JSON.stringify(manifest), JSON.stringify(await wikiPublicationManifest({ loreRoot: root, documents: documents.toReversed(), registry })))
  assert.ok(registrationErrors({ ...page, domain: 'unknown' }, registry).some((error) => error.startsWith('E_CATEGORY_DOMAIN:')))
  await writeFile(resolve(root, 'culture/Duplicate.json'), JSON.stringify(page))
  await assert.rejects(wikiPublicationManifest({ loreRoot: root, documents: [...documents, { ...documents.find(({ route }) => route === '/world/Added'), slug: 'Duplicate', route: '/world/Duplicate' }], registry }), /E_PUBLICATION_DUPLICATE_ID/)
})
