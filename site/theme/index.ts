import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import PeopleSearch from './components/PeopleSearch.vue'
import TerritoryMap from './components/TerritoryMap.vue'
import { decideEntry, homeUrl, load, onLocaleNavigation, readPath, save } from './machines/localePref'
import './custom.css'

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ app, router, siteData }) {
    app.component('PeopleSearch', PeopleSearch)
    app.component('TerritoryMap', TerritoryMap)
    if (typeof window === 'undefined') return

    const base = siteData.value.base
    const entry = readPath(window.location.pathname, base)
    const decision = decideEntry({ stored: load(window.localStorage), pathLocale: entry.locale, isLocaleHome: entry.isLocaleHome })
    if (decision.kind === 'redirect') {
      window.location.replace(homeUrl(decision.to, base) + window.location.search + window.location.hash)
      return
    }

    let current = entry.locale
    const previous = router.onAfterRouteChange
    router.onAfterRouteChange = async (to) => {
      await previous?.(to)
      const next = readPath(new URL(to, window.location.origin).pathname, base).locale
      const changed = onLocaleNavigation(current, next)
      if (changed) save(window.localStorage, changed)
      current = next
    }
  },
}
export default theme
