import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import PeopleSearch from './components/PeopleSearch.vue'
import TerritoryMap from './components/TerritoryMap.vue'
import './custom.css'

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('PeopleSearch', PeopleSearch)
    app.component('TerritoryMap', TerritoryMap)
  },
}
export default theme
