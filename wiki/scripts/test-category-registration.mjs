import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import test from 'node:test'
import { categoryIndex, loadCategoryRegistry, registeredCategories, registrationErrors } from './category-registration.mjs'

const root = resolve(import.meta.dirname, '../..')
const registryPath = new URL('./category-registry.json', import.meta.url)

const document = (categories = ['culture']) => ({
  domain: 'culture', slug: 'Sample', categories,
  locales: { ko: { title: '글', summary: '내용' }, en: { title: 'Article', summary: 'Content' } },
  source: { kind: 'original-fiction', refs: ['lore/culture/Sample.md'] },
  content: [
    { kind: 'heading', anchor: '표제', depth: 1, text: { ko: '글', en: 'Article' } },
    { kind: 'paragraph', anchor: '본문', text: { ko: '내용', en: 'Content' } },
  ],
})

test('known categories register by domain, even without an explicit category', async () => {
  const registry = await loadCategoryRegistry(registryPath)
  assert.equal(registry.categories.length, 13)
  const page = document()
  delete page.categories
  assert.deepEqual(registeredCategories(page, registry), ['culture'])
  assert.deepEqual(registrationErrors(page, registry, 'Sample.json'), [])
  const index = categoryIndex([{ slug: 'Sample', route: '/world/Sample', title: '글', categories: registeredCategories(page, registry) }], registry)
  assert.equal(index.uncategorized.length, 0)
  assert.deepEqual(index.categories.find(({ id }) => id === 'culture').documents.map(({ slug }) => slug), ['Sample'])
})

test('unknown domains and categories cannot publish', async () => {
  const registry = await loadCategoryRegistry(registryPath)
  assert.deepEqual(registrationErrors({ ...document(), domain: 'editorial' }, registry, 'Bad.json'), ['E_CATEGORY_DOMAIN:Bad.json:editorial'])
  assert.deepEqual(registrationErrors(document(['missing']), registry, 'Bad.json'), ['E_CATEGORY_UNKNOWN:Bad.json:missing'])
  assert.deepEqual(registrationErrors(document([]), registry, 'Bad.json'), ['E_CATEGORY_SHAPE:Bad.json'])
  assert.deepEqual(registrationErrors(document(['culture', 'culture']), registry, 'Bad.json'), ['E_CATEGORY_DUPLICATE:Bad.json'])
})

test('the private category template enforces source, locale, and content shape', async () => {
  const registry = await loadCategoryRegistry(registryPath)
  assert.deepEqual(registrationErrors({ ...document(), source: { kind: 'original-fiction', refs: [] } }, registry, 'Bad.json'), ['E_CATEGORY_SOURCE:Bad.json'])
  assert.deepEqual(registrationErrors({ ...document(), locales: { ko: { title: '글' } } }, registry, 'Bad.json'), ['E_CATEGORY_LOCALES:Bad.json'])
  assert.deepEqual(registrationErrors({ ...document(), content: [document().content[0]] }, registry, 'Bad.json'), ['E_CATEGORY_CONTENT:Bad.json:culture:paragraph'])
  const places = { ...document(['places']), domain: 'places' }
  assert.deepEqual(registrationErrors(places, registry, 'Bad.json'), ['E_CATEGORY_CONTENT:Bad.json:places:table'])
  assert.deepEqual(registrationErrors({ ...places, content: [...places.content, { kind: 'table' }] }, registry, 'Bad.json'), [])
})

test('all current authored JSON documents satisfy their category templates', async () => {
  const registry = await loadCategoryRegistry(registryPath)
  const ignored = new Set(['name-pools', 'regions', 'editorial', 'sources'])
  const walk = async (dir) => {
    const pages = []
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const path = join(dir, entry.name)
      if (entry.isDirectory() && !ignored.has(entry.name)) pages.push(...await walk(path))
      else if (entry.isFile() && entry.name.endsWith('.json') && !entry.name.startsWith('authoring.')) {
        const page = JSON.parse(await readFile(path, 'utf8'))
        if (page && typeof page.domain === 'string' && Array.isArray(page.content)) pages.push({ path, page })
      }
    }
    return pages
  }
  const pages = await walk(join(root, 'lore'))
  assert.ok(pages.length > 0)
  for (const { path, page } of pages) {
    assert.deepEqual(registrationErrors(page, registry, basename(path)), [], path)
    assert.ok(registeredCategories(page, registry).length > 0, path)
  }
})

test('the generated index covers all published documents, including projections', async () => {
  const source = await readFile(new URL('../src/generated/categoryIndex.ts', import.meta.url), 'utf8')
  const index = JSON.parse(source.split('export const categoryIndex = ')[1].split(' as const satisfies')[0])
  const manifest = JSON.parse(await readFile(new URL('../public/wiki-contract.json', import.meta.url), 'utf8'))
  const entries = index.categories.flatMap(({ documents }) => documents)
  assert.deepEqual(index.uncategorized, [])
  assert.deepEqual(new Set(entries.map(({ route }) => route)), new Set(manifest.documents.map(({ route }) => route)))
  assert.equal(entries.length, manifest.documents.length)
  assert.ok(index.categories.find(({ id }) => id === 'bestiary').documents.some(({ slug }) => slug === 'Hostile-Group-G01'))
})

test('categories declared on an existing page must remain in the known registry', async () => {
  const registry = await loadCategoryRegistry(registryPath)
  const page = JSON.parse(await readFile(join(root, 'lore/culture/Martial-Paths.json'), 'utf8'))
  assert.deepEqual(page.categories, ['culture'])
  assert.deepEqual(registrationErrors(page, registry, 'Martial-Paths.json'), [])
  assert.deepEqual(registrationErrors({ ...page, categories: ['unregistered'] }, registry, 'Martial-Paths.json'), [
    'E_CATEGORY_UNKNOWN:Martial-Paths.json:unregistered',
  ])
})
