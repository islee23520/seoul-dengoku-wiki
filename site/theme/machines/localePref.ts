export type Locale = 'en' | 'ko'

export const LOCALES: readonly Locale[] = ['en', 'ko']
// Shared with the inline head script in site/build.mjs (langScript), which makes the entry decision before render.
export const STORAGE_KEY = 'sdw-lang'

// The entry decision runs in the inline head script (no flash of the wrong language); this module only records
// the reader's choice when a navigation changes the locale (the language switch).
export const rules = [
  { when: '?lang=en|ko in the URL', do: 'store it as the choice and show that locale' },
  { when: 'a choice is stored', do: 'never guess again; only a locale home (/ or /ko/) moves to the stored locale' },
  { when: 'nothing stored', do: 'the first en/ko entry of navigator.languages picks the locale; any other language -> English' },
  { when: 'the equivalent page does not exist, or the path is the showcase or a non-HTML asset', do: 'stay' },
  { when: 'a navigation changes the locale of the URL', do: 'store the new locale (the user chose it)' },
] as const

export function onLocaleNavigation(prev: Locale, next: Locale): Locale | null {
  return prev === next ? null : next
}

export function readPath(pathname: string, base: string): { locale: Locale; isLocaleHome: boolean; rest: string } {
  const withoutBase = pathname.startsWith(base) ? pathname.slice(base.length) : pathname.replace(/^\//, '')
  const clean = withoutBase.replace(/index\.html$/, '')
  const locale: Locale = clean === 'ko' || clean.startsWith('ko/') ? 'ko' : 'en'
  const rest = locale === 'ko' ? clean.replace(/^ko\/?/, '') : clean
  return { locale, isLocaleHome: rest === '', rest }
}

export function save(storage: Pick<Storage, 'setItem'> | null, locale: Locale): void {
  try { storage?.setItem(STORAGE_KEY, locale) } catch { /* storage can be unavailable; the URL still decides the language */ }
}
