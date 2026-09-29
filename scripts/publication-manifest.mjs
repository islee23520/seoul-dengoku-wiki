import { createPublicationManifest, validatePublicationManifest } from '@seoul-dengoku/publication-manifest'
import { approvedDocuments } from './catalog-admission.mjs'

export { validatePublicationManifest }

export async function wikiPublicationManifest({ loreRoot, documents, registry }) {
  const admittedDocuments = (await approvedDocuments(loreRoot)).filter((doc) => {
      const castOnlyPattern = /^Cast-State-\d+$|^Core-Characters$|^Cast-Unaffiliated$|^Cast-Index-S4$|^Cast-Index$|^Cast-Relations$|^Cast-Corridors-Index$/
      return !castOnlyPattern.test(doc.route?.split('/').pop() || doc.slug || '')
    })
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
