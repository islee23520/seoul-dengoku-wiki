import { access, readdir, readFile } from 'node:fs/promises'
import { basename, join, relative, resolve } from 'node:path'
import { glossaryDocument } from './glossary-document.mjs'
import { loadCategoryRegistry, registrationErrors } from './category-registration.mjs'
import { openReadOnly } from './cast-sqlite/db.mjs'
import { readCatalogPages, readCatalogGlossary, readCatalogPagesAsync, readCatalogGlossaryAsync } from './cast-sqlite/catalog-pages.mjs'

export const readerFields = ['slug', 'title', 'route', 'reviewText', 'blocks']
export const catalogFields = ['domain', 'slug', 'route', 'title']

export const unknownFields = (value, allowed) =>
  Object.keys(value).filter((field) => !allowed.includes(field))

const atlasProjectionPaths = [
  'Operating-Houses.json',
  'Regional-Physical-AI-Arcs.json',
  'Synthetic-Actors.json',
  'World-Expansion-Index.json',
  'World-Relation-Ledger.json',
  'factions/External-Theaters.json',
  'bestiary/Hostile-Ecology-Index.json',
  ...Array.from({ length: 26 }, (_, index) => `bestiary/groups/Hostile-Group-G${String(index + 1).padStart(2, '0')}.json`),
]

export const atlasDocumentPaths = Object.freeze(['World-Narrative-Atlas.json', ...atlasProjectionPaths])
const atlasPathSet = new Set(atlasDocumentPaths)
const retiredCastArticle = /^Cast-State-\d+$|^Core-Characters$|^Cast-Unaffiliated$|^Cast-Index-S4$|^Cast-Index$|^Cast-Relations$|^Cast-Corridors-Index$/u
const discoveredSources = new WeakMap()
const fail = (code, source = '') => { throw Object.assign(new Error(`${code}:${source}`), { code, source }) }

// Approved sources publish directly. Draft sources publish once category
// registration is ready; approved sources still reach publication validation,
// which must reject invalid metadata.
export function publicationEligible(document) {
  const sources = discoveredSources.get(document)
  if (!sources || sources.length === 0) fail('E_PUBLICATION_DISCOVERY', document.source)
  return sources.every(({ approved, categoryErrors }) => approved || categoryErrors.length === 0)
}

export function publishedDocuments(documents) {
  return documents.filter(document => publicationEligible(document)
    && !retiredCastArticle.test(document.route.split('/').at(-1)))
}

const exists = async (path) => {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

const defaultAtlasCheck = async (options) => {
  const { materializeWorldAtlas } = await import('./materialize-world-atlas.mjs')
  return materializeWorldAtlas(options)
}

const admissionDocuments = (categoryRegistry) => {
  const slugs = new Set()
  const documents = []
  const add = (slug, source, id, sources) => {
    const document = Object.freeze({ source, id, route: `/world/${slug === 'index' ? '' : slug}` })
    discoveredSources.set(document, sources)
    documents.push(document)
  }
  const addPage = (page) => {
    const sourcePath = page.path.slice('lore/'.length)
    add(page.slug, page.path, atlasPathSet.has(sourcePath) ? `wiki:${page.slug}` : page.value.id,
      [{
        source: page.path, approved: page.value.status === 'approved',
        categoryErrors: page.value.status === 'approved' ? [] : registrationErrors({ ...page.value, slug: page.slug }, categoryRegistry, basename(page.path))
      }])
    slugs.add(page.slug)
  }
  const addWorldIndex = () => {
    for (const slug of ['Glossary', 'index']) {
      if (slugs.has(slug)) throw new Error(`E_PUBLISH_SOURCE_COLLISION:${slug}`)
      slugs.add(slug)
      const sources = slug === 'Glossary'
        ? [{ source: 'lore/glossary.json', approved: true, categoryErrors: [] }]
        : ['Core-Characters', 'Sixteen-States', 'Scenario-Timeline'].map(dependency =>
          documents.find(row => row.route === `/world/${dependency}`))
          .flatMap(document => document ? discoveredSources.get(document) : [null])
      add(slug, slug === 'index' ? 'scripts/build-world-index.mjs' : 'lore/glossary.json', `wiki:${slug}`, sources.every(Boolean) ? sources : [])
    }
  }
  const sorted = () => documents.sort((left, right) => left.route < right.route ? -1 : left.route > right.route ? 1 : 0)
  return { slugs, add, addPage, addWorldIndex, sorted }
}

// Match the publisher's lore JSON selection. The atlas source and projections use
// the ordinary JSON path, but only after the materializer verifies the committed set.
export async function approvedDocuments(loreRoot, { checkAtlas = defaultAtlasCheck, includeWorldIndex = true,
  db, dbPath = process.env.WIKI_DOCUMENT_DB, categoryRegistry: suppliedCategoryRegistry } = {}) {
  dbPath ??= resolve(loreRoot, '../data/canonical/wiki-cast.sqlite')
  const categoryRegistry = suppliedCategoryRegistry ?? await loadCategoryRegistry(new URL('./category-registry.json', import.meta.url))
  const atlasPath = resolve(loreRoot, 'World-Narrative-Atlas.json')
  if (db || dbPath !== undefined) {
    const { materializeWorldAtlas } = await import('./cast-sqlite/atlas-materializer.mjs')
    await materializeWorldAtlas({ atlasPath, outDir: loreRoot, check: true, db, dbPath })
  } else await checkAtlas({ atlasPath, outDir: loreRoot, check: true })
  const { slugs, add, addPage, addWorldIndex, sorted } = admissionDocuments(categoryRegistry)
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const path = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!['name-pools', 'regions', 'editorial', 'sources'].includes(entry.name)) await walk(path)
      } else if (entry.isFile() && entry.name.endsWith('.json') && !entry.name.startsWith('authoring.')) {
        const bytes = await readFile(path)
        const value = JSON.parse(bytes.toString())
        if (value && typeof value === 'object' && !Array.isArray(value) && typeof value.domain === 'string' && Array.isArray(value.content)) {
          const slug = basename(entry.name, '.json')
          if (slugs.has(slug)) throw new Error(`E_DUPLICATE_LORE_SLUG:${slug}`)
          slugs.add(slug)
          const sourcePath = relative(loreRoot, path).replaceAll('\\', '/')
          // The JSON document is the only source; a Markdown file beside it is a stale twin.
          const twin = sourcePath.replace(/\.json$/u, '.md')
          if (await exists(resolve(loreRoot, twin))) throw new Error(`E_MARKDOWN_TWIN:${twin}`)
          const source = `lore/${sourcePath}`
          add(slug, source, atlasPathSet.has(sourcePath) ? `wiki:${slug}` : value.id,
            [{
              source, approved: value.status === 'approved',
              categoryErrors: value.status === 'approved' ? [] : registrationErrors({ ...value, slug }, categoryRegistry, entry.name)
            }])
        }
      }
    }
  }
  if (db || dbPath !== undefined) {
    const connection = db ?? openReadOnly(dbPath)
    try {
      for (const page of readCatalogPages(connection)) addPage(page)
    } finally { if (!db) connection.close() }
  } else await walk(loreRoot)

  if (!includeWorldIndex) return sorted()
  // The Glossary page is generated from the term dictionary, so the dictionary must build it.
  if (db || dbPath !== undefined) {
    const connection = db ?? openReadOnly(dbPath)
    try {
      glossaryDocument(readCatalogGlossary(connection))
    } finally { if (!db) connection.close() }
  } else {
    glossaryDocument(JSON.parse(await readFile(join(loreRoot, 'glossary.json'), 'utf8')))
  }
  addWorldIndex()
  return sorted()
}

// PostgreSQL admission uses only the caller's snapshot transaction for source
// discovery, atlas validation and the generated glossary's admission checks.
export async function approvedDocumentsAsync(loreRoot, { tx, includeWorldIndex = true,
  categoryRegistry: suppliedCategoryRegistry, peopleContext } = {}) {
  if (!tx || typeof tx.all !== 'function') throw new Error('E_CATALOG_ADMISSION_ASYNC_TX_REQUIRED')
  const { readCatalogMetadataDocumentAsync, CATEGORY_REGISTRY_PATH } = await import('./cast-sqlite/catalog-metadata.mjs')
  const categoryRegistry = suppliedCategoryRegistry ?? await readCatalogMetadataDocumentAsync(tx, CATEGORY_REGISTRY_PATH)
  const { materializeWorldAtlasAsync } = await import('./cast-sqlite/atlas-materializer.mjs')
  if (!peopleContext) {
    const { readAtlasIdentityAsync } = await import('./cast-sqlite/atlas-identity.mjs')
    peopleContext = await readAtlasIdentityAsync(tx)
  }
  await materializeWorldAtlasAsync({
    tx, peopleContext,
    atlasPath: resolve(loreRoot, 'World-Narrative-Atlas.json'), outDir: loreRoot, check: true
  })
  const { addPage, addWorldIndex, sorted } = admissionDocuments(categoryRegistry)
  for (const page of await readCatalogPagesAsync(tx)) addPage(page)
  if (!includeWorldIndex) return sorted()
  glossaryDocument(await readCatalogGlossaryAsync(tx))
  addWorldIndex()
  return sorted()
}

export async function approvedRoutes(loreRoot) {
  return (await approvedDocuments(loreRoot)).map(({ route }) => route)
}
