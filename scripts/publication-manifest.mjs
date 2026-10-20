import { createPublicationManifest, validatePublicationManifest } from '@seoul-dengoku/publication-manifest'
import { approvedDocuments, publishedDocuments } from './catalog-admission.mjs'

export { validatePublicationManifest }

export async function wikiPublicationManifest({ loreRoot, documents, registry, publicationReview }) {
  publishedDocuments([], publicationReview)
  const admittedDocuments = publishedDocuments(await approvedDocuments(loreRoot), publicationReview)
  const admittedByRoute = new Map(admittedDocuments.map((document) => [document.route, document]))
  for (const { route } of documents) {
    if (!admittedByRoute.has(route)) throw Object.assign(new Error(`E_PUBLICATION_SOURCE_UNPUBLISHED:${route}`), { code: 'E_PUBLICATION_SOURCE_UNPUBLISHED', route })
  }
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
