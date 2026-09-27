import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { approvedDocuments, categories } from './catalog-admission.mjs'

const parentRoot = process.env.SEOUL_KENSHI_ROOT ?? resolve(import.meta.dirname, '../../..')
export const { createPublicationManifest, validatePublicationManifest } = await import(pathToFileURL(resolve(parentRoot, 'TOOL/tools/doc-publishing/publication-manifest.mjs')).href)

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
