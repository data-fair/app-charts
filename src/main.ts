import 'vuetify/styles'
import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { vuetifySessionOptions } from '@data-fair/lib-vuetify'
import { createSession } from '@data-fair/lib-vue/session.js'
import { createReactiveSearchParams } from '@data-fair/lib-vue/reactive-search-params.js'
import { createUiNotif } from '@data-fair/lib-vue/ui-notif.js'
import { createLocaleDayjs } from '@data-fair/lib-vue/locale-dayjs.js'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import App from './App.vue'
import { createConfig } from '@/composables/config'

// Expose reactiveSearchParams to the v-iframe-compat shim injected by DataFair
// to avoid full page reloads when the app is itself embedded in a parent d-frame
// (portal, dashboard, another app via <d-frame>). Without this block, the shim
// falls back to window.location.href = src on every updateSrc -> reload -> flicker.
// Must be at module level, BEFORE createApp().
;(window as { vIframeOptions?: { reactiveParams: typeof reactiveSearchParams } }).vIframeOptions = { reactiveParams: reactiveSearchParams }

async function init () {
  const session = await createSession({ directoryUrl: '/simple-directory', siteInfo: true })
  const app = createApp(App)
  app.use(createVuetify({
    ...vuetifySessionOptions(session),
    icons: { defaultSet: 'mdi', aliases, sets: { mdi } }
  }))
  app.use(createReactiveSearchParams())
  app.use(createUiNotif())
  app.use(createLocaleDayjs(session.lang.value))
  app.use(createConfig())
  app.mount('#app')
}

init()
