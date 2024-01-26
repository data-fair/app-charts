import '@mdi/font/css/materialdesignicons.css'
import 'url-polyfill'
import 'vuetify/styles'
import './styles/settings.scss'
import colors from 'vuetify/lib/util/colors'
import App from './App.vue'
import router from './router'
import useMainStore from '@/stores/useMainStore'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import { VAutocomplete, VContainer, VRow, VCol } from 'vuetify/components'

const StorePlugin = {
  install(app, options) {
    const pinia = createPinia()
    app.use(pinia)

    const store = useMainStore()
    store.init(options.environement)

    window.vIframeOptions = { router: app.config.globalProperties.$router, reactiveParams: true }
    app.provide('mainStore', store)

    app.config.globalProperties.$mainStore = store
  }
}

const vuetify = createVuetify({
  components: {
    VAutocomplete,
    VContainer,
    VRow,
    VCol
  },
  theme: {
    defaultTheme: 'myTheme',
    themes: {
      myTheme: {
        colors: {
          primary: colors.blue.darken1,
          accent: colors.orange.base
        }
      }
    }
  }
})

const app = createApp(App)
let env = import.meta.env

if (env === undefined) {
  env = {
    defaultDataFairUrl: process.env.DEFAULT_DATA_FAIR ?? 'http://localhost:5888'
  }
}

app.use(StorePlugin, { environement: env })
app.use(router)
app.use(vuetify)

app.mount('#app')
