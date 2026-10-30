// Publish only Korean; other locales remain in the authoring source.
export const wikiLocales = ['ko']
export const defaultLocale = 'ko'

export const localizedRoute = (locale, domain, slug) =>
  `${locale === defaultLocale ? '' : `/${locale}`}/${domain}/${slug === 'index' ? '' : slug}`

export function localizedDocuments({ domain, slug, json, markdown, renderJson, titleFallback }) {
  if (json && markdown !== undefined) throw new Error(`E_DUAL_SOURCE:${slug}`)
  if (json) {
    return wikiLocales.map((locale) => {
      const labels = json.locales?.[locale]
      if (!labels?.title) throw new Error(`E_LOCALE_MISSING:${slug}:${locale}`)
      return {
        locale,
        domain,
        slug,
        route: localizedRoute(locale, domain, slug),
        title: labels.title,
        summary: labels.summary ?? '',
        markdown: renderJson(json, locale),
      }
    })
  }
  if (markdown === undefined) throw new Error(`E_SOURCE_MISSING:${slug}`)
  return [{
    locale: defaultLocale,
    domain,
    slug,
    route: localizedRoute(defaultLocale, domain, slug),
    title: titleFallback(markdown, slug),
    summary: '',
    markdown,
  }]
}
