import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import PeopleSearch from './components/PeopleSearch.vue'
import './custom.css'

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('PeopleSearch', PeopleSearch)
  },
}
export default theme
