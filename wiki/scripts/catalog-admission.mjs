import { readdir, readFile } from 'node:fs/promises'
import { basename, join, relative } from 'node:path'
import { extractAtlasJson, sha256Text } from './world-atlas-parse.mjs'
import { projectionsFromAtlas } from './world-atlas-render.mjs'

export const readerFields = ['slug', 'title', 'route', 'reviewText', 'blocks']
export const catalogFields = ['domain', 'slug', 'route', 'title']

export const unknownFields = (value, allowed) =>
  Object.keys(value).filter((field) => !allowed.includes(field))

// Match the publisher's lore JSON selection, then include only its three
// explicit Markdown sources and the projections derived from the atlas.
export async function approvedDocuments(loreRoot) {
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
          add(slug, `lore/${relative(loreRoot, path).replaceAll('\\', '/')}`, value.id)
        }
      }
    }
  }
  await walk(loreRoot)

  const atlasMarkdown = await readFile(join(loreRoot, 'World-Narrative-Atlas.md'), 'utf8')
  const atlas = extractAtlasJson(atlasMarkdown)
  if (!atlas.ok) throw new Error(`E_ATLAS_JSON:${atlas.error}`)
  for (const name of Object.keys(projectionsFromAtlas(atlas.value, sha256Text(atlasMarkdown)))) {
    const slug = basename(name, '.md')
    if (slugs.has(slug)) throw new Error(`E_PROJECTION_COLLIDES_WITH_JSON:${slug}`)
    slugs.add(slug)
    add(slug, 'lore/World-Narrative-Atlas.md', `wiki:${slug}`)
  }
  await readFile(join(loreRoot, 'Glossary.md'), 'utf8')
  for (const slug of ['Glossary', 'World-Narrative-Atlas', 'index']) {
    if (slugs.has(slug)) throw new Error(`E_PUBLISH_SOURCE_COLLISION:${slug}`)
    slugs.add(slug)
    add(slug, slug === 'index' ? 'wiki/scripts/build-world-index.mjs' : `lore/${slug}.md`, `wiki:${slug}`)
  }
  return documents.sort((left, right) => left.route < right.route ? -1 : left.route > right.route ? 1 : 0)
}

export async function approvedRoutes(loreRoot) {
  return (await approvedDocuments(loreRoot)).map(({ route }) => route)
}
