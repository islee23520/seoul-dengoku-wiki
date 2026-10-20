import { access, readdir, readFile } from 'node:fs/promises'
import { basename, join, relative, resolve } from 'node:path'
import { glossaryDocument } from './glossary-document.mjs'
import { loadCategoryRegistry, registrationErrors } from './category-registration.mjs'
import { isAuthenticatedPublicationReview } from './seoul-census.mjs'
import { sha256 } from './seoul-scope.mjs'

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

// Pure eligibility inspection also accepts synthetic validator results. Public
// consumers must enter through publishedDocuments, which authenticates authority.
/** @param {import('./seoul-census.mjs').PublicationReview} publicationReview */
export function publicationEligible(document, publicationReview) {
  const sources = discoveredSources.get(document)
  if (!sources || sources.length === 0) fail('E_PUBLICATION_DISCOVERY', document.source)
  return sources.every(({ source, currentSha256, approved, categoryErrors }) => {
    const decision = publicationReview.documents.find(row => row.sourcePath === source)
    if (!decision) fail('E_REVIEW_COVERAGE', source)
    if (decision.currentSha256 !== currentSha256) fail('E_REVIEW_HASH', source)
    // Authenticated exact publication reviews may activate sources whose authoring
    // status remains draft, but only once category registration is ready. Approved
    // sources still reach publication validation, which must reject invalid metadata.
    // Synthetic inspections cannot grant draft activation authority.
    return (approved || categoryErrors.length === 0 && isAuthenticatedPublicationReview(publicationReview)) && decision.eligible && decision.classification === 'current-reviewed'
      && decision.reason === 'approved-exact-review' && decision.receipt !== null
  })
}

/** @param {import('./seoul-census.mjs').PublicationReview} publicationReview */
export function publishedDocuments(documents, publicationReview) {
  if (!isAuthenticatedPublicationReview(publicationReview)) fail('E_PUBLICATION_REVIEW_AUTHORITY')
  if (!publicationReview.complete || publicationReview.semanticReview !== 'reviewed') fail('E_PUBLICATION_REVIEW_PENDING')
  return documents.filter(document => publicationEligible(document, publicationReview)
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

// Match the publisher's lore JSON selection. The atlas source and projections use
// the ordinary JSON path, but only after the materializer verifies the committed set.
export async function approvedDocuments(loreRoot, { checkAtlas = defaultAtlasCheck, includeWorldIndex = true } = {}) {
  const categoryRegistry = await loadCategoryRegistry(new URL('./category-registry.json', import.meta.url))
  const atlasPath = resolve(loreRoot, 'World-Narrative-Atlas.json')
  await checkAtlas({ atlasPath, outDir: loreRoot, check: true })
  const slugs = new Set()
  const documents = []
  const add = (slug, source, id, sources) => {
    const document = Object.freeze({ source, id, route: `/world/${slug === 'index' ? '' : slug}` })
    discoveredSources.set(document, sources)
    documents.push(document)
  }
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
            [{ source, currentSha256: sha256(bytes), approved: value.status === 'approved',
              categoryErrors: value.status === 'approved' ? [] : registrationErrors({ ...value, slug }, categoryRegistry, entry.name) }])
        }
      }
    }
  }
  await walk(loreRoot)

  if (!includeWorldIndex) return documents.sort((left, right) => left.route < right.route ? -1 : left.route > right.route ? 1 : 0)
  // The Glossary page is generated from the term dictionary, so the dictionary must build it.
  const glossaryBytes = await readFile(join(loreRoot, 'glossary.json'))
  glossaryDocument(JSON.parse(glossaryBytes.toString()))
  for (const slug of ['Glossary', 'index']) {
    if (slugs.has(slug)) throw new Error(`E_PUBLISH_SOURCE_COLLISION:${slug}`)
    slugs.add(slug)
    const sources = slug === 'Glossary'
      ? [{ source: 'lore/glossary.json', currentSha256: sha256(glossaryBytes), approved: true }]
      : ['Core-Characters', 'Sixteen-States', 'Scenario-Timeline'].map(dependency =>
        documents.find(row => row.route === `/world/${dependency}`))
        .flatMap(document => document ? discoveredSources.get(document) : [null])
    add(slug, slug === 'index' ? 'scripts/build-world-index.mjs' : 'lore/glossary.json', `wiki:${slug}`, sources.every(Boolean) ? sources : [])
  }
  return documents.sort((left, right) => left.route < right.route ? -1 : left.route > right.route ? 1 : 0)
}

export async function approvedRoutes(loreRoot) {
  return (await approvedDocuments(loreRoot)).map(({ route }) => route)
}
