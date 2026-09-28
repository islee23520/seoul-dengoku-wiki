import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { access, mkdir, mkdtemp, readdir, readFile, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import test from 'node:test'
import { approvedDocuments, catalogFields, readerFields, unknownFields } from './catalog-admission.mjs'
import { loadCategoryRegistry, registeredCategories, registrationErrors } from './category-registration.mjs'
import { validatePublicationManifest } from './publication-manifest.mjs'

const wikiRoot = resolve(import.meta.dirname, '..')
const loreRoot = resolve(process.env.WIKI_LORE_ROOT ?? resolve(wikiRoot, 'lore'))
const worldRoot = resolve(wikiRoot, 'src/generated/world')
const englishWorldRoot = resolve(wikiRoot, 'src/generated/world-en')
const localized = (en, ko) => ({ en, ko })

const content = (title) => [{
  kind: 'heading', anchor: `${title.toLowerCase()}-heading`, depth: 1,
  text: localized(title, title),
}]

const atlasDocument = () => ({
  version: 1, domain: 'root', id: 'WNA-001', slug: 'World-Narrative-Atlas', status: 'approved',
  categories: ['overview'], tense: { en: 'present', ko: 'present' },
  locales: {
    en: { title: 'World Narrative Atlas', summary: 'Atlas summary', tense: 'present' },
    ko: { title: '세계 서사 아틀라스', summary: '아틀라스 요약', tense: 'present' },
  },
  source: { kind: 'original-fiction', refs: ['lore/World-Narrative-Atlas.json'] },
  provenance: { original_anchor: 'lore/World-Narrative-Atlas.md', original_hash: null, history: [] },
  content: content('Atlas'),
  data: { atlas: { schema: 'world-narrative-atlas.v2', document: { id: 'WNA-001' } } },
})

const projectionDocument = ({ id, slug, domain = 'root', categories }) => ({
  version: 1, domain, id, slug, status: 'approved', categories,
  tense: { en: 'present', ko: 'present' },
  locales: {
    en: { title: slug, summary: `${slug} summary`, tense: 'present' },
    ko: { title: slug, summary: `${slug} 요약`, tense: 'present' },
  },
  source: { kind: 'computed', refs: ['lore/World-Narrative-Atlas.json'] },
  provenance: { original_anchor: 'lore/World-Narrative-Atlas.json', original_hash: 'a'.repeat(64), history: ['world-atlas-projections.v2'] },
  content: content(slug), data: {},
})

async function syntheticAtlasRoot() {
  const root = await mkdtemp(resolve(tmpdir(), 'wiki-t14-fixture-'))
  await mkdir(resolve(root, 'bestiary/groups'), { recursive: true })
  await mkdir(resolve(root, 'culture'), { recursive: true })
  await writeFile(resolve(root, 'World-Narrative-Atlas.json'), JSON.stringify(atlasDocument()))
  await writeFile(resolve(root, 'Operating-Houses.json'), JSON.stringify(projectionDocument({
    id: 'DOC:Operating-Houses', slug: 'Operating-Houses', categories: ['factions'],
  })))
  await writeFile(resolve(root, 'bestiary/groups/Hostile-Group-G01.json'), JSON.stringify(projectionDocument({
    id: 'G01', slug: 'Hostile-Group-G01', domain: 'bestiary', categories: ['bestiary'],
  })))
  return root
}

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

test('atlas admission uses one verified JSON source plus JSON projections without Markdown synthesis', async () => {
  const root = await syntheticAtlasRoot()
  const checks = []
  const admitted = await approvedDocuments(root, {
    checkAtlas: async (options) => checks.push(options),
    includeWorldIndex: false,
  })
  assert.deepEqual(checks, [{ atlasPath: resolve(root, 'World-Narrative-Atlas.json'), outDir: root, check: true }])
  assert.deepEqual(admitted, [
    { source: 'lore/bestiary/groups/Hostile-Group-G01.json', id: 'wiki:Hostile-Group-G01', route: '/world/Hostile-Group-G01' },
    { source: 'lore/Operating-Houses.json', id: 'wiki:Operating-Houses', route: '/world/Operating-Houses' },
    { source: 'lore/World-Narrative-Atlas.json', id: 'wiki:World-Narrative-Atlas', route: '/world/World-Narrative-Atlas' },
  ])
  await writeFile(resolve(root, 'World-Narrative-Atlas.md'), '# forbidden twin\n')
  await assert.rejects(approvedDocuments(root, { checkAtlas: async () => {}, includeWorldIndex: false }), /E_MARKDOWN_TWIN:World-Narrative-Atlas\.md/)
})

test('any admitted JSON document with a Markdown twin is rejected', async () => {
  const root = await syntheticAtlasRoot()
  await writeFile(resolve(root, 'culture/Added.json'), JSON.stringify(projectionDocument({
    id: 'DOC:Added', slug: 'Added', domain: 'culture', categories: ['culture'],
  })))
  const options = { checkAtlas: async () => {}, includeWorldIndex: false }
  assert.ok((await approvedDocuments(root, options)).some(({ source }) => source === 'lore/culture/Added.json'))
  await writeFile(resolve(root, 'culture/Added.md'), '# forbidden twin\n')
  await assert.rejects(approvedDocuments(root, options), /E_MARKDOWN_TWIN:culture\/Added\.md/)
})

test('a new draft JSON fixture registers while private and non-document fixtures stay excluded', async () => {
  const root = await syntheticAtlasRoot()
  const page = {
    id: 'DOC:Added', domain: 'culture', status: 'draft',
    locales: { ko: { title: '추가 문서', summary: '요약' }, en: { title: 'Added', summary: 'Summary' } },
    source: { kind: 'original-fiction', refs: ['lore/culture/Added.md'] },
    content: [{ kind: 'heading' }, { kind: 'paragraph' }],
  }
  for (const directory of ['editorial', 'sources', 'name-pools', 'regions']) await mkdir(resolve(root, directory))
  for (const name of ['culture/Added.json', 'editorial/Hidden.json', 'sources/Hidden.json', 'name-pools/Hidden.json', 'regions/Hidden.json', 'culture/authoring.Hidden.json']) {
    await writeFile(resolve(root, name), JSON.stringify(page))
  }
  await writeFile(resolve(root, 'culture/Dataset.json'), JSON.stringify({ records: [] }))
  const admitted = await approvedDocuments(root, { checkAtlas: async () => {}, includeWorldIndex: false })
  assert.ok(!admitted.some(({ route }) => /Hidden|Dataset/.test(route)))
  assert.ok(admitted.some(({ source, id, route }) => source === 'lore/culture/Added.json' && id === page.id && route === '/world/Added'))
  const registry = await loadCategoryRegistry(new URL('./category-registry.json', import.meta.url))
  assert.deepEqual(registrationErrors(page, registry), [])
  assert.deepEqual(registeredCategories(page, registry), ['culture'])
  assert.ok(registrationErrors({ ...page, domain: 'unknown' }, registry).some((error) => error.startsWith('E_CATEGORY_DOMAIN:')))
})
