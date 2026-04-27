import 'vuetify/styles'
import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { vuetifySessionOptions } from '@data-fair/lib-vuetify'
import { createSession } from '@data-fair/lib-vue/session.js'
import App from './App.vue'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { createConfig } from '@/composables/config'

async function init () {
  const session = await createSession({ directoryUrl: '/simple-directory', siteInfo: true })
  const app = createApp(App)
  app.use(createVuetify({
    ...vuetifySessionOptions(session),
    icons: { defaultSet: 'mdi', aliases, sets: { mdi } }
  }))
  app.use(createConfig())
  app.mount('#app')
}

init()
