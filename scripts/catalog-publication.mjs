import { basename } from 'node:path'
import { registrationErrors } from './category-publication.mjs'

const atlasProjectionPaths = [
  'Operating-Houses.json', 'Regional-Physical-AI-Arcs.json', 'Synthetic-Actors.json',
  'World-Expansion-Index.json', 'World-Relation-Ledger.json', 'factions/External-Theaters.json',
  'bestiary/Hostile-Ecology-Index.json',
  ...Array.from({ length: 26 }, (_, index) => `bestiary/groups/Hostile-Group-G${String(index + 1).padStart(2, '0')}.json`),
]
export const atlasDocumentPaths = Object.freeze(['World-Narrative-Atlas.json', ...atlasProjectionPaths])
const atlasPathSet = new Set(atlasDocumentPaths)
const retiredCastArticle = /^Cast-State-\d+$|^Core-Characters$|^Cast-Unaffiliated$|^Cast-Index-S4$|^Cast-Index$|^Cast-Relations$|^Cast-Corridors-Index$/u
const discoveredSources = new WeakMap()

export function catalogSourceEligible(identity) {
  return identity.corpus_kind === 'current' && identity.status !== 'excluded' && !identity.excluded
    && !identity.document_id.startsWith('__EXAMPLE__:')
    && /^lore\//u.test(identity.logical_path)
    && !/^lore\/(?:name-pools|regions|editorial|sources)\//u.test(identity.logical_path)
    && !basename(identity.logical_path).startsWith('authoring.')
}

export function publicationEligible(document) {
  const sources = discoveredSources.get(document)
  if (!sources || sources.length === 0) throw Object.assign(new Error(`E_PUBLICATION_DISCOVERY:${document.source}`), { code: 'E_PUBLICATION_DISCOVERY', source: document.source })
  return sources.every(({ approved, categoryErrors }) => approved || categoryErrors.length === 0)
}

export function publishedDocuments(documents) {
  return documents.filter(document => publicationEligible(document)
    && !retiredCastArticle.test(document.route.split('/').at(-1)))
}

export const admissionDocuments = (categoryRegistry) => {
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
