const atlasProjectionSlugs = new Set([
  'Operating-Houses', 'Regional-Physical-AI-Arcs', 'Synthetic-Actors', 'World-Expansion-Index',
  'World-Relation-Ledger', 'External-Theaters', 'Hostile-Ecology-Index',
  ...Array.from({ length: 26 }, (_, index) => `Hostile-Group-G${String(index + 1).padStart(2, '0')}`),
])

const verifiedAtlasProjection = (document) =>
  atlasProjectionSlugs.has(document.slug) &&
  document.source?.kind === 'computed' &&
  document.source.refs?.includes('lore/World-Narrative-Atlas.json') &&
  document.provenance?.original_anchor === 'lore/World-Narrative-Atlas.json' &&
  document.provenance?.history?.includes('world-atlas-projections.v2')

export function registeredCategories(document, registry) {
  const known = new Set(registry.categories.map((category) => category.id))
  if (!Object.hasOwn(document, 'categories')) return known.has(document.domain) ? [document.domain] : []
  return document.categories
}

export function registrationErrors(document, registry, sourceName) {
  const name = sourceName ?? document.slug ?? 'document'
  const known = new Set(registry.categories.map((category) => category.id))
  if (!known.has(document.domain) && document.domain !== 'root') return [`E_CATEGORY_DOMAIN:${name}:${document.domain ?? ''}`]
  const categories = registeredCategories(document, registry)
  if (!Array.isArray(categories) || categories.length === 0 || categories.some((id) => typeof id !== 'string' || id.length === 0)) return [`E_CATEGORY_SHAPE:${name}`]
  if (new Set(categories).size !== categories.length) return [`E_CATEGORY_DUPLICATE:${name}`]
  const unknown = categories.filter((id) => !known.has(id)).map((id) => `E_CATEGORY_UNKNOWN:${name}:${id}`)
  if (unknown.length) return unknown
  const errors = []
  if (!document.locales?.ko?.title || !document.locales?.ko?.summary || !document.locales?.en?.title || !document.locales?.en?.summary) errors.push(`E_CATEGORY_LOCALES:${name}`)
  if (!document.source?.kind || !Array.isArray(document.source.refs) || document.source.refs.length === 0 ||
    document.source.refs.some((ref) => typeof ref !== 'string' || ref.length === 0)) errors.push(`E_CATEGORY_SOURCE:${name}`)
  if (verifiedAtlasProjection(document)) {
    if (!document.content.some((node) => node?.kind === 'heading')) errors.push(`E_CATEGORY_CONTENT:${name}:atlas-projection:heading`)
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
