import '@mdi/font/css/materialdesignicons.min.css'
import 'url-polyfill'
import 'vuetify/styles'
import './styles/settings.scss'
import { createApp, defineAsyncComponent } from 'vue'
import { createVuetify } from 'vuetify'
import { defaultOptions } from '@data-fair/lib/vuetify.js'

const vuetify = createVuetify(defaultOptions)
const asyncApp = defineAsyncComponent(() => import('./App.vue'))

let env = import.meta.env
if (env === undefined) {
  env = {
    defaultDataFairUrl: process.env.DEFAULT_DATA_FAIR ?? 'http://localhost:5888'
  }
} else {
  env.defaultDataFairUrl = env.VITE_DEFAULT_DATA_FAIR ?? 'http://localhost:5888'
}

const app = createApp(asyncApp)
app.provide('vuetify', vuetify)
app.provide('startEnv', env)
app.use(vuetify)

app.mount('#app')
