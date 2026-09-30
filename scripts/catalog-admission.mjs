import { access, readdir, readFile } from 'node:fs/promises'
import { basename, join, relative, resolve } from 'node:path'
import { glossaryDocument } from './glossary-document.mjs'

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

export const publishedDocuments = (documents) => documents.filter(({ route }) => !retiredCastArticle.test(route.split('/').at(-1)))

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
  const atlasPath = resolve(loreRoot, 'World-Narrative-Atlas.json')
  await checkAtlas({ atlasPath, outDir: loreRoot, check: true })
  const slugs = new Set()
  const documents = []
  const add = (slug, source, id) => {
    documents.push({ source, id, route: `/world/${slug === 'index' ? '' : slug}` })
  }
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue
      const path = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!['name-pools', 'regions', 'editorial', 'sources'].includes(entry.name)) await walk(path)
      } else if (entry.isFile() && entry.name.endsWith('.json') && !entry.name.startsWith('authoring.')) {
        const value = JSON.parse(await readFile(path, 'utf8'))
        if (value && typeof value === 'object' && !Array.isArray(value) && typeof value.domain === 'string' && Array.isArray(value.content)) {
          const slug = basename(entry.name, '.json')
          if (slugs.has(slug)) throw new Error(`E_DUPLICATE_LORE_SLUG:${slug}`)
          slugs.add(slug)
          const sourcePath = relative(loreRoot, path).replaceAll('\\', '/')
          // The JSON document is the only source; a Markdown file beside it is a stale twin.
          const twin = sourcePath.replace(/\.json$/u, '.md')
          if (await exists(resolve(loreRoot, twin))) throw new Error(`E_MARKDOWN_TWIN:${twin}`)
          add(slug, `lore/${sourcePath}`, atlasPathSet.has(sourcePath) ? `wiki:${slug}` : value.id)
        }
      }
    }
  }
  await walk(loreRoot)

  if (!includeWorldIndex) return documents.sort((left, right) => left.route < right.route ? -1 : left.route > right.route ? 1 : 0)
  // The Glossary page is generated from the term dictionary, so the dictionary must build it.
  glossaryDocument(JSON.parse(await readFile(join(loreRoot, 'glossary.json'), 'utf8')))
  for (const slug of ['Glossary', 'index']) {
    if (slugs.has(slug)) throw new Error(`E_PUBLISH_SOURCE_COLLISION:${slug}`)
    slugs.add(slug)
    add(slug, slug === 'index' ? 'scripts/build-world-index.mjs' : 'lore/glossary.json', `wiki:${slug}`)
  }
  return documents.sort((left, right) => left.route < right.route ? -1 : left.route > right.route ? 1 : 0)
}

export async function approvedRoutes(loreRoot) {
  return (await approvedDocuments(loreRoot)).map(({ route }) => route)
}
