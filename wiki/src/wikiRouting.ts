const wikiDomains = new Set(['world'])

export const wikiBase = '/wiki'

// Other hub sites share the origin; their paths are not wiki routes.
export const hubPrefixes = ['/gdd/', '/play/', '/ui-layout-moodboard/', '/ui-ux-refs/']

export const toWikiPath = (path: string): string => {
  if (path === '/') return `${wikiBase}/`
  if (hubPrefixes.some((prefix) => path.startsWith(prefix))) return path
  return `${wikiBase}${path.startsWith('/') ? path : `/${path}`}`
}

export const stateRoute = (slug: string): string => `/states/${slug}`

export const normalizeWikiHref = (href: string | undefined): string => {
  if (!href) return '#'
  if (href.startsWith('#') || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) return href

  const [path, hash = ''] = href.split('#', 2)
  const normalizedPath = path
    .replace(/\.md$/i, '')
    .replace(/\.html$/i, '')
    .replace(/\/index$/i, '/')

  const segments = normalizedPath.split('/').filter(Boolean)
  if (segments.length > 0 && wikiDomains.has(segments[0])) {
    return `/${segments.join('/')}${normalizedPath.endsWith('/') ? '/' : ''}${hash ? `#${hash}` : ''}`
  }
  return `${normalizedPath}${hash ? `#${hash}` : ''}`
}
