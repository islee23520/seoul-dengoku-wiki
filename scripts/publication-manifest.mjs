import { createPublicationManifest, validatePublicationManifest } from '@seoul-dengoku/publication-manifest'
import { approvedDocuments, publishedDocuments } from './catalog-admission.mjs'

export { validatePublicationManifest }

export async function wikiPublicationManifest({ loreRoot, documents, registry }) {
  const admittedDocuments = publishedDocuments(await approvedDocuments(loreRoot))
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
