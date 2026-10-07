import type { Category } from '@seoul-dengoku/shared-web-ui'
import manifestJson from './generated/publication-manifest.json'
import { gddCatalog } from './generated/gddCatalog'

export interface ManifestDocument {
  readonly source: string
  readonly id: string
  readonly title: string
  readonly summary: string
  readonly categoryIds: readonly string[]
  readonly route: string
  readonly contentRef: string
}

export interface ManifestCategory {
  readonly id: string
  readonly label: string
  readonly route: string
  readonly documentIds: readonly string[]
}

interface PublicationManifest {
  readonly schemaVersion: number
  readonly site: string
  readonly categories: readonly ManifestCategory[]
  readonly documents: readonly ManifestDocument[]
}

const manifest = manifestJson as PublicationManifest

// Shared components render literal hrefs; the tree carries router paths and each consumer resolves them.
export const publicBase = '/gdd'

export const toPublicHref = (href: string) => `${publicBase}${href}`

export const manifestCategories: readonly ManifestCategory[] = manifest.categories
export const manifestDocuments: readonly ManifestDocument[] = manifest.documents
export const proposalRoutes: ReadonlySet<string> = new Set(gddCatalog.filter(({ status }) => status === 'proposal').map(({ route }) => route))

export const categoryLabelById = new Map(manifest.categories.map((category) => [category.id, category.label]))

const documentById = new Map(manifest.documents.map((document) => [document.id, document]))
const documentRoutes = new Set(manifest.documents.map((document) => document.route))

export const treeCategories: Category[] = manifest.categories.map((category) => ({
  id: category.id,
  title: category.label,
  href: `/documents?category=${category.id}`,
  documents: category.documentIds.flatMap((id) => {
    const document = documentById.get(id)
    if (!document) return []
    return [{ id: document.id, title: document.title, href: document.route, summary: document.summary || undefined, meta: proposalRoutes.has(document.route) ? `설계 제안 · ${document.source}` : document.source }]
  }),
}))

// Router paths (without the /gdd base) that anchor interception may turn into client-side navigation.
export const isAppRoute = (path: string): boolean =>
  path === '/' || path === '/documents' || path === '/data' || documentRoutes.has(path)
