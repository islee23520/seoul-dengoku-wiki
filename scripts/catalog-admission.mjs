import { access, readdir, readFile } from 'node:fs/promises'
import { basename, join, relative, resolve } from 'node:path'
import { glossaryDocument } from './glossary-document.mjs'
import { loadCategoryRegistry, registrationErrors } from './category-registration.mjs'
import { admissionDocuments, atlasDocumentPaths } from './catalog-publication.mjs'
export { atlasDocumentPaths, publicationEligible, publishedDocuments } from './catalog-publication.mjs'
import { openReadOnly } from './cast-sqlite/db.mjs'
import { readCatalogPages, readCatalogGlossary, readCatalogPagesAsync, readCatalogGlossaryAsync } from './cast-sqlite/catalog-pages.mjs'

export const readerFields = ['slug', 'title', 'route', 'reviewText', 'blocks']
export const catalogFields = ['domain', 'slug', 'route', 'title']

export const unknownFields = (value, allowed) =>
  Object.keys(value).filter((field) => !allowed.includes(field))
const atlasPathSet = new Set(atlasDocumentPaths)


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
