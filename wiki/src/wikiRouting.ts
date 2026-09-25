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

export const worldRegionMapRoute = '/world/World-and-Subway-Layers'

export const resolveRegionSelection = <T extends { id: string; name: string; district?: string }>(regions: readonly T[], requested: string | null): string | null => {
  const segments = requested?.split('/')
  const regionName = segments?.[segments.length - 1]
  const district = segments && segments.length > 1 ? segments[segments.length - 2] : undefined
  return regions.find((region) =>
    (region.id === regionName || region.id.slice(7) === regionName || region.name === regionName) &&
    (!district || region.district === district || region.id.startsWith(`region:${district}`)),
  )?.id ?? regions.find((region) => region.id === regionName || region.id.slice(7) === regionName || region.name === regionName)?.id ?? regions[0]?.id ?? null
}

export const resolveLegacyRegionRoute = (pathname: string): string | undefined => {
  const path = pathname.replace(/\/(?:index)?(?:\.html)?$/i, '').replace(/\.html$/i, '')
  const match = path.match(/^\/(?:world\/)?regions(?:\/(.+))?$/i)
  const directDong = path.match(/^\/world\/([^/]+)$/i)?.[1]
  let decodedDong: string | undefined
  try { decodedDong = directDong ? decodeURIComponent(directDong) : undefined } catch { return undefined }
  const selection = match?.[1] ?? (decodedDong && /(?:동|region:[0-9]+|[0-9]{10})$/u.test(decodedDong) ? directDong : undefined)
  if (!match && !selection) return undefined
  if (!selection) return worldRegionMapRoute
  try { return `${worldRegionMapRoute}?region=${encodeURIComponent(decodeURIComponent(selection))}` } catch { return worldRegionMapRoute }
}

export const legacyWorldRoutes: Readonly<Record<string, string>> = {
  'Conscription-Remnants': 'Sixteen-States',
  'Factions-and-Diplomacy': 'Chaebol-Houses-and-Century-Factions',
  'Heirs-Names-and-World-Ledger': 'Hangnyeol-and-Bon-gwan',
  'Ambitions-and-Relations': 'Cast-Relations',
}

export const resolveLegacyWorldRoute = (slug: string): string | undefined =>
  legacyWorldRoutes[slug] ? `/world/${legacyWorldRoutes[slug]}` : undefined

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
