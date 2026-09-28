// Category registration for published lore JSON.
// The registry is the template. An authored document is indexed under its domain
// even when it omits `categories`. An explicit list replaces that default and
// must name known categories. A domain outside the registry fails generation.
// Category templates validate source metadata and content structure before publishing.
// Public pages never receive the private template text.
import { readFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const atlasProjectionSlugs = new Set([
  'Operating-Houses',
  'Regional-Physical-AI-Arcs',
  'Synthetic-Actors',
  'World-Expansion-Index',
  'World-Relation-Ledger',
  'External-Theaters',
  'Hostile-Ecology-Index',
  ...Array.from({ length: 26 }, (_, index) => `Hostile-Group-G${String(index + 1).padStart(2, '0')}`),
])

const verifiedAtlasProjection = (document) =>
  atlasProjectionSlugs.has(document.slug) &&
  document.source?.kind === 'computed' &&
  document.source.refs?.includes('lore/World-Narrative-Atlas.json') &&
  document.provenance?.original_anchor === 'lore/World-Narrative-Atlas.json' &&
  document.provenance?.history?.includes('world-atlas-projections.v2')

export async function loadCategoryRegistry(registryPath) {
  const registry = JSON.parse(await readFile(registryPath, 'utf8'))
  const categories = registry.categories ?? []
  const ids = categories.map((category) => category.id)
  if (new Set(ids).size !== ids.length) throw new Error('E_CATEGORY_REGISTRY_DUPLICATE')
  for (const category of categories) {
    if (!category.id || !category.label || !Array.isArray(category.requiredKinds) || category.requiredKinds.length === 0 ||
      category.requiredKinds.some((kind) => !['heading', 'paragraph', 'list', 'table'].includes(kind))) {
      throw new Error(`E_CATEGORY_REGISTRY_SHAPE:${category.id ?? ''}`)
    }
  }
  return registry
}

export function registeredCategories(document, registry) {
  const known = new Set(registry.categories.map((category) => category.id))
  if (!Object.hasOwn(document, 'categories')) {
    return known.has(document.domain) ? [document.domain] : []
  }
  return document.categories
}

export function registrationErrors(document, registry, sourceName) {
  const name = sourceName ?? document.slug ?? 'document'
  const known = new Set(registry.categories.map((category) => category.id))
  if (!known.has(document.domain) && document.domain !== 'root') {
    return [`E_CATEGORY_DOMAIN:${name}:${document.domain ?? ''}`]
  }
  const categories = registeredCategories(document, registry)
  if (!Array.isArray(categories) || categories.length === 0 || categories.some((id) => typeof id !== 'string' || id.length === 0)) {
    return [`E_CATEGORY_SHAPE:${name}`]
  }
  if (new Set(categories).size !== categories.length) return [`E_CATEGORY_DUPLICATE:${name}`]
  const unknown = categories.filter((id) => !known.has(id)).map((id) => `E_CATEGORY_UNKNOWN:${name}:${id}`)
  if (unknown.length) return unknown
  const errors = []
  if (!document.locales?.ko?.title || !document.locales?.ko?.summary || !document.locales?.en?.title || !document.locales?.en?.summary) {
    errors.push(`E_CATEGORY_LOCALES:${name}`)
  }
  if (!document.source?.kind || !Array.isArray(document.source.refs) || document.source.refs.length === 0 ||
    document.source.refs.some((ref) => typeof ref !== 'string' || ref.length === 0)) {
    errors.push(`E_CATEGORY_SOURCE:${name}`)
  }
  if (verifiedAtlasProjection(document)) {
    if (!document.content.some((node) => node?.kind === 'heading')) {
      errors.push(`E_CATEGORY_CONTENT:${name}:atlas-projection:heading`)
    }
    return errors
  }
  for (const id of categories) {
    const category = registry.categories.find((entry) => entry.id === id)
    for (const kind of category.requiredKinds) {
      if (!document.content.some((node) => node?.kind === kind)) errors.push(`E_CATEGORY_CONTENT:${name}:${id}:${kind}`)
    }
  }
  return errors
}

export function categoryIndex(documents, registry) {
  const byId = new Map(registry.categories.map((category) => [category.id, {
    id: category.id,
    label: category.label,
    summary: category.summary ?? '',
    documents: [],
  }]))
  const uncategorized = []
  for (const document of documents) {
    const entry = {
      slug: document.slug,
      route: document.route,
      title: document.title,
    }
    const ids = document.categories ?? []
    if (ids.length === 0) {
      uncategorized.push(entry)
      continue
    }
    for (const id of ids) byId.get(id).documents.push(entry)
  }
  for (const category of byId.values()) {
    category.documents.sort((left, right) => left.title.localeCompare(right.title, 'ko'))
  }
  uncategorized.sort((left, right) => left.title.localeCompare(right.title, 'ko'))
  return { categories: [...byId.values()], uncategorized }
}

const isDirectRun = process.argv[1] && basename(process.argv[1]) === 'category-registration.mjs'
if (isDirectRun) {
  const root = dirname(fileURLToPath(import.meta.url))
  const registry = await loadCategoryRegistry(join(root, 'category-registry.json'))
  const target = process.argv[2]
  if (!target) {
    console.log(registry.categories.map((category) => `${category.id}\t${category.requiredKinds.join(',')}`).join('\n'))
  } else {
    const document = JSON.parse(await readFile(target, 'utf8'))
    const errors = registrationErrors(document, registry, basename(target))
    if (errors.length) {
      console.error(errors.join('\n'))
      process.exitCode = 1
    } else {
      console.log(`registered:${registeredCategories(document, registry).join(',')}`)
    }
  }
}
