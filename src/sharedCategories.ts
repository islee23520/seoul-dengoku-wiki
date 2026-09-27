import type { Category } from '@seoul-dengoku/shared-web-ui'
import { categoryIndex, type WikiCategory } from './generated/categoryIndex'

export const toSharedCategory = (category: WikiCategory): Category => ({
  id: category.id,
  title: category.label,
  href: `/categories/${category.id}`,
  documents: category.documents.map((document) => ({
    id: document.slug,
    title: document.title,
    href: document.route,
  })),
})

export const sharedCategories: Category[] = categoryIndex.categories.map(toSharedCategory)

/** Shared module anchors bypass the BrowserRouter basename, so anchor hrefs need the /wiki prefix. */
export const wikiAnchorHref = (route: string) => `/wiki${route}`
