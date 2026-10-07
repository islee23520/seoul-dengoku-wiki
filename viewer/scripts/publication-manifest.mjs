import { createPublicationManifest, validatePublicationManifest } from '@seoul-dengoku/publication-manifest'
import { approvedDocuments, categories } from './catalog-admission.mjs'

export { validatePublicationManifest }

export async function gddPublicationManifest({ gddRoot, pagesRoot, sources, documents }) {
  return createPublicationManifest({
    site: 'gdd',
    categories: categories.map(({ id, label }) => ({ id, label, route: `/documents?category=${id}` })),
    documents: documents.map(({ sourcePath, id, title, summary, category, route, contentRef }) => ({
      source: sourcePath, id, title, summary, categoryIds: [category], route, contentRef,
    })),
    admittedDocuments: await approvedDocuments(gddRoot, pagesRoot, sources),
  })
}
