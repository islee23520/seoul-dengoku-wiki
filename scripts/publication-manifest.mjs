import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { approvedDocuments } from './catalog-admission.mjs'

const parentRoot = process.env.SEOUL_KENSHI_ROOT ?? resolve(import.meta.dirname, '../..')
export const { createPublicationManifest, validatePublicationManifest } = await import(pathToFileURL(resolve(parentRoot, 'TOOL/tools/doc-publishing/publication-manifest.mjs')).href)

export async function wikiPublicationManifest({ loreRoot, documents, registry }) {
  const admittedDocuments = await approvedDocuments(loreRoot)
  const admittedByRoute = new Map(admittedDocuments.map((document) => [document.route, document]))
  return createPublicationManifest({
    site: 'wiki',
    categories: registry.categories.map(({ id, label }) => ({ id, label, route: `/categories/${id}` })),
    documents: documents.map(({ slug, title, summary, categories, route }) => ({
      source: admittedByRoute.get(route)?.source,
      id: admittedByRoute.get(route)?.id,
      title, summary, categoryIds: categories, route,
      contentRef: `src/generated/world/${slug}.json`,
    })),
    admittedDocuments,
  })
}
