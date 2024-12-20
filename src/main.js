import 'vuetify/styles'
import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { defaultOptions } from '@data-fair/lib-vuetify'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import App from './App.vue'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'

const app = createApp(App)

const options = defaultOptions(reactiveSearchParams)
options.icons = {
  defaultSet: 'mdi',
  aliases,
  sets: {
    mdi
  }
}
app.use(createVuetify(options))

app.mount('#app')
