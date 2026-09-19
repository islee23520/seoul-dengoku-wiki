import DefaultTheme from 'vitepress/theme'
import InfoBox from './components/InfoBox.vue'
import NavBox from './components/NavBox.vue'
import './custom.css'

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    app.component('InfoBox', InfoBox)
    app.component('NavBox', NavBox)
  }
}
