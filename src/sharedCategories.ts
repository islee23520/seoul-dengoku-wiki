import { categoryIndex, type WikiCategory } from './generated/categoryIndex'

export const categoryHref = (path: readonly string[]) => `/categories/${path.join('~')}`

export const categoryEntityCount = (category: WikiCategory): number => category.entities.length + category.children.reduce((count, child) => count + categoryEntityCount(child), 0)

export const categoryTrail = (id: string | undefined): WikiCategory[] => {
  const trail: WikiCategory[] = []
  let children: readonly WikiCategory[] = categoryIndex.categories
  for (const segment of id?.split('~') ?? []) {
    const category = children.find((item) => item.id === segment)
    if (!category) return []
    trail.push(category)
    children = category.children
  }
  return trail
}

/** Shared module anchors bypass the BrowserRouter basename, so anchor hrefs need the /wiki prefix. */
export const wikiAnchorHref = (route: string) => `/wiki${route}`
