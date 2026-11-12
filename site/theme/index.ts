import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import PeopleSearch from './components/PeopleSearch.vue'
import TerritoryMap from './components/TerritoryMap.vue'
import { onLocaleNavigation, readPath, save } from './machines/localePref'
import './custom.css'

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ app, router, siteData }) {
    app.component('PeopleSearch', PeopleSearch)
    app.component('TerritoryMap', TerritoryMap)
    if (typeof window === 'undefined') return

    const base = siteData.value.base
    // The entry redirect (stored choice, ?lang=, browser language) runs in the inline head script from build.mjs.
    let current = readPath(window.location.pathname, base).locale
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
