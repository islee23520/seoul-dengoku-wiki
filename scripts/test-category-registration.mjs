import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import { test } from 'vitest'
import { categoryEntities, categoryIndex, loadCategoryRegistry, registeredCategories, registrationErrors } from './category-registration.mjs'

test('entity paths create nested branches while preserving document registration', async () => {
  const registry = await loadCategoryRegistry(new URL('./category-registry.json', import.meta.url))
  const entity = { category: 'technology', id: 'DOC:test#power', title: '발전기', route: '/world/Test#power', source: 'lore/Test.json#/content/1', path: [{ id: 'power', label: '전력' }, { id: 'generation', label: '발전' }] }
  const index = categoryIndex([], registry, [entity])
  assert.equal(index.categories.find((node) => node.id === 'technology').children[0].children[0].entities[0].id, entity.id)
  assert.throws(() => categoryIndex([], registry, [entity, entity]), /E_CATEGORY_ENTITY_DUPLICATE/)
  assert.throws(() => categoryIndex([], registry, [{ ...entity, category: 'missing' }]), /E_CATEGORY_ENTITY_PARENT/)
})

test('canonical entities retain source identities and omit faith and candidate equipment', async () => {
  const paths = ['World-Narrative-Atlas', 'culture/Martial-Paths', 'technology/Lost-Technology-Lineage']
  const pages = await Promise.all(paths.map(async (path) => ({ path: `lore/${path}.json`, slug: path.split('/').at(-1), value: JSON.parse(await readFile(new URL(`../lore/${path}.json`, import.meta.url), 'utf8')) })))
  const documents = [...pages.map((page) => ({ slug: page.slug, route: `/world/${page.slug}` })), ...Array.from({ length: 26 }, (_, i) => ({ slug: `Hostile-Group-G${String(i + 1).padStart(2, '0')}`, route: `/world/Hostile-Group-G${String(i + 1).padStart(2, '0')}` }))]
  const entities = categoryEntities(pages, documents)
  assert.equal(entities.filter((item) => item.category === 'bestiary').length, 250)
  assert.equal(entities.filter((item) => item.category === 'culture').length, 75)
  assert.ok(entities.some((item) => item.id === 'G01E01' && item.route.endsWith('#g01e01')))
  assert.ok(entities.filter((item) => /^G(?:07|08|09|10|11|12)E/.test(item.id)).every((item) => item.path[0].id === 'bestiary-human'))
  assert.ok(entities.filter((item) => /^G(?:19|20|21|22|23|24)E/.test(item.id)).every((item) => item.path[0].id === 'bestiary-infected'))
  assert.ok(!entities.some((item) => item.id.startsWith('G27')))
  assert.ok(!entities.some((item) => /신앙|숭배|의례/.test(item.title)))
  assert.ok(entities.some((item) => item.title === '축전 모듈' && item.path[0].id === 'technology-power'))
  assert.ok(entities.some((item) => item.title === 'G25 등불개미' && item.kind === '기계 라인'))
  assert.ok(entities.some((item) => item.title === 'G26 철공룡' && item.kind === '기계 라인'))
  assert.ok(entities.find((item) => item.title === '축전 모듈').source.startsWith('lore/technology/'))
  const technology = pages.find((page) => page.slug === 'Lost-Technology-Lineage')
  const moduleBlock = technology.value.content.find((node) => node.anchor === 'g25-등불개미-list4')
  if (moduleBlock.kind === 'paragraph') {
    for (const name of ['발광 탐색 렌즈', '상부 수송 호퍼', '다지 관절 구동계', '자율 충전 단자', '장애물 파쇄 턱']) {
      const entity = entities.find((item) => item.title === name)
      assert.ok(entity, name)
      assert.ok(entity.id.startsWith(`${technology.value.id}#${moduleBlock.anchor}:`), name)
      assert.equal(entity.route, '/world/Lost-Technology-Lineage#g25-등불개미')
    }
    assert.equal(entities.find((item) => item.title === '센서 모듈').id, 'DOC:Lost-Technology-Lineage#지하-부품-경제-list2:센서 모듈')
    const lens = entities.find((item) => item.title === '발광 탐색 렌즈')
    const emitter = entities.find((item) => item.title === '진동 음파 방출기')
    assert.ok(!lens.description.includes('상부 수송 호퍼') && !lens.description.includes('장애물 파쇄 턱'))
    assert.ok(!emitter.description.includes('유압 중장비 하체') && !emitter.description.includes('외부 보강 장갑판'))
    for (const entity of entities.filter((item) => item.descriptionRange)) {
      const anchor = entity.source.split('#')[1]
      const block = technology.value.content.find((node) => node.anchor === anchor)
      if (!block || typeof block.text?.ko !== 'string') continue
      assert.equal(block.text.ko.slice(entity.descriptionRange.start, entity.descriptionRange.end), entity.description)
    }
  }
})

const root = resolve(import.meta.dirname, '..')
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

const atlasProjection = ({ slug, categories, domain = 'root', content }) => ({
  ...document(categories),
  domain, slug,
  source: { kind: 'computed', refs: ['lore/World-Narrative-Atlas.json'] },
  provenance: {
    original_anchor: 'lore/World-Narrative-Atlas.json',
    original_hash: 'a'.repeat(64),
    history: ['world-atlas-projections.v2'],
  },
  content,
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

test('technology narrative registers without a synthetic table', async () => {
  const registry = await loadCategoryRegistry(registryPath)
  const page = { ...document(['technology']), domain: 'technology' }
  assert.deepEqual(registrationErrors(page, registry), [])
  assert.ok(registrationErrors({ ...page, content: [page.content[0]] }, registry).some((error) => error.endsWith(':paragraph')))
})

test('unknown domains and categories cannot publish', async () => {
  const registry = await loadCategoryRegistry(registryPath)
  assert.deepEqual(registrationErrors({ ...document(), domain: 'editorial' }, registry, 'Bad.json'), ['E_CATEGORY_DOMAIN:Bad.json:editorial'])
  assert.deepEqual(registrationErrors(document(['missing']), registry, 'Bad.json'), ['E_CATEGORY_UNKNOWN:Bad.json:missing'])
  assert.deepEqual(registrationErrors(document([]), registry, 'Bad.json'), ['E_CATEGORY_SHAPE:Bad.json'])
  assert.deepEqual(registrationErrors(document(['culture', 'culture']), registry, 'Bad.json'), ['E_CATEGORY_DUPLICATE:Bad.json'])
})

test('root atlas documents register under explicit known reader categories', async () => {
  const registry = await loadCategoryRegistry(registryPath)
  const page = { ...document(['overview']), domain: 'root', slug: 'World-Narrative-Atlas' }
  assert.deepEqual(registeredCategories(page, registry), ['overview'])
  assert.deepEqual(registrationErrors(page, registry, 'World-Narrative-Atlas.json'), [])
  assert.deepEqual(registrationErrors({ ...page, categories: undefined }, registry, 'World-Narrative-Atlas.json'), [
    'E_CATEGORY_SHAPE:World-Narrative-Atlas.json',
  ])
})

test('verified atlas projections use their generator content contract instead of category filler', async () => {
  const registry = await loadCategoryRegistry(registryPath)
  const heading = [{ kind: 'heading', anchor: 'heading', depth: 1, text: { ko: '표제', en: 'Heading' } }]
  const projection = atlasProjection({ slug: 'External-Theaters', categories: ['places'], domain: 'factions', content: heading })
  assert.deepEqual(registrationErrors(projection, registry, 'External-Theaters.json'), [])
  assert.deepEqual(registrationErrors({ ...projection, source: { kind: 'computed', refs: ['lore/Other.json'] } }, registry, 'External-Theaters.json'), [
    'E_CATEGORY_CONTENT:External-Theaters.json:places:paragraph',
    'E_CATEGORY_CONTENT:External-Theaters.json:places:table',
  ])
  assert.deepEqual(registrationErrors({ ...projection, content: [] }, registry, 'External-Theaters.json'), [
    'E_CATEGORY_CONTENT:External-Theaters.json:atlas-projection:heading',
  ])
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
