import '@data-fair/lib-vuetify/style/global.scss'
import './styles/main.css'
import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { createI18n } from 'vue-i18n'
import { createSession } from '@data-fair/lib-vue/session.js'
import { vuetifySessionOptions } from '@data-fair/lib-vuetify'
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
  // le <script> _public.js d'index.html pose window.__PUBLIC_SITE_INFO, lu sans
  // requête ; siteInfo déclenche refreshSiteInfo (déprécié) et ne reste qu'en repli
  const session = await createSession({
    directoryUrl: '/simple-directory',
    siteInfo: !window.__PUBLIC_SITE_INFO
  })

  // options indépendantes de la locale : Intl en déduit séparateurs, marque décimale
  // et espace avant le signe pourcent — même jeu enregistré pour toutes les langues
  const percentFormats = {
    percent: { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 },
    percentPrecise: { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }
  } as const
  const i18n = createI18n({
    legacy: false,
    locale: session.lang.value,
    fallbackLocale: 'en',
    numberFormats: { fr: percentFormats, en: percentFormats }
  })

  const vuetify = createVuetify({
    ...vuetifySessionOptions(session),
    icons: { defaultSet: 'mdi', aliases, sets: { mdi } }
  })

  const app = createApp(App)
  app.use(vuetify)
    .use(session)
    .use(i18n)
    .use(createLocaleDayjs(session.lang.value))
    .use(createReactiveSearchParams())
    .use(createUiNotif())
    .use(createConfig())
  app.mount('#app')
}

init()
