import '@mdi/font/css/materialdesignicons.min.css'
import 'url-polyfill'
import 'vuetify/styles'
import './styles/settings.scss'
import useAppInfo from './composables/useAppInfo'
import { createApp, defineAsyncComponent } from 'vue'
import { createVuetify } from 'vuetify'
import { defaultOptions } from '@data-fair/lib/vuetify.js'

const AppInfoPlugin = {
  install(app, options) {
    const appInfo = useAppInfo()
    appInfo.init(options.environement)

    app.provide('appInfo', appInfo)
    app.config.globalProperties.$appInfo = appInfo
  }
}

const vuetify = createVuetify(defaultOptions)
const asyncApp = defineAsyncComponent(() => import('./App.vue'))

const app = createApp(asyncApp)
app.provide('vuetify', vuetify)
let env = import.meta.env

if (env === undefined) {
  env = {
    defaultDataFairUrl: process.env.DEFAULT_DATA_FAIR ?? 'http://localhost:5888'
  }
}

app.use(AppInfoPlugin, { environement: env })
app.use(vuetify)

app.mount('#app')
