const wikiDomains = new Set(['world', 'rules', 'design'])

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
