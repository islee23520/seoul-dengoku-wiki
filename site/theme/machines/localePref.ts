export type Locale = 'en' | 'ko'

export const LOCALES: readonly Locale[] = ['en', 'ko']
export const STORAGE_KEY = 'smd-locale'

export interface Entry {
  stored: Locale | null
  pathLocale: Locale
  isLocaleHome: boolean
}

export type Decision = { kind: 'stay' } | { kind: 'redirect'; to: Locale }

export const rules = [
  { when: 'nothing stored', do: 'stay: English is the default, the browser language is never guessed' },
  { when: 'stored equals the locale of the URL', do: 'stay' },
  { when: 'stored differs and the URL is a locale home (/ or /ko/)', do: 'redirect to the stored locale home' },
  { when: 'stored differs and the URL is any other page', do: 'stay: a shared deep link is never rewritten' },
  { when: 'a navigation changes the locale of the URL', do: 'store the new locale (the user chose it)' },
] as const

export function decideEntry({ stored, pathLocale, isLocaleHome }: Entry): Decision {
  if (stored === null || stored === pathLocale) return { kind: 'stay' }
  return isLocaleHome ? { kind: 'redirect', to: stored } : { kind: 'stay' }
}

export function onLocaleNavigation(prev: Locale, next: Locale): Locale | null {
  return prev === next ? null : next
}

export function parseStored(raw: string | null | undefined): Locale | null {
  return raw === 'en' || raw === 'ko' ? raw : null
}

export function readPath(pathname: string, base: string): { locale: Locale; isLocaleHome: boolean; rest: string } {
  const withoutBase = pathname.startsWith(base) ? pathname.slice(base.length) : pathname.replace(/^\//, '')
  const clean = withoutBase.replace(/index\.html$/, '')
  const locale: Locale = clean === 'ko' || clean.startsWith('ko/') ? 'ko' : 'en'
  const rest = locale === 'ko' ? clean.replace(/^ko\/?/, '') : clean
  return { locale, isLocaleHome: rest === '', rest }
}

export function homeUrl(locale: Locale, base: string): string {
  return locale === 'ko' ? `${base}ko/` : base
}

export function load(storage: Pick<Storage, 'getItem'> | null): Locale | null {
  try { return parseStored(storage?.getItem(STORAGE_KEY)) } catch { return null }
}

export function save(storage: Pick<Storage, 'setItem'> | null, locale: Locale): void {
  try { storage?.setItem(STORAGE_KEY, locale) } catch { /* storage can be unavailable; the URL still decides the language */ }
}
