import '@mdi/font/css/materialdesignicons.css'
import 'url-polyfill'
import 'vuetify/styles'
import './styles/settings.scss'
import colors from 'vuetify/lib/util/colors'
import App from './App.vue'
import router from './router'
import useAppInfo from './composables/useAppInfo'
import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { VAutocomplete, VContainer, VRow, VCol } from 'vuetify/components'

const AppInfoPlugin = {
  install(app, options) {
    const appInfo = useAppInfo()
    appInfo.init(options.environement)

    window.vIframeOptions = {
      router: app.config.globalProperties.$router,
      reactiveParams: true
    }

    app.provide('appInfo', appInfo)
    app.config.globalProperties.$appInfo = appInfo
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

app.use(AppInfoPlugin, { environement: env })
app.use(router)
app.use(vuetify)

app.mount('#app')
