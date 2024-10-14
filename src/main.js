import 'vuetify/styles'
import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { defaultOptions } from '@data-fair/lib/vuetify.js'
import reactiveSearchParams from '@data-fair/lib/vue/reactive-search-params-global.js'
import App from './App.vue'

const app = createApp(App)

// @ts-ignore
app.use(createVuetify(defaultOptions(reactiveSearchParams)))

app.mount('#app')
