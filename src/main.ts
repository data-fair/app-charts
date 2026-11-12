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
  // the _public.js <script> of index.html sets window.__PUBLIC_SITE_INFO, read without
  // a request; siteInfo triggers refreshSiteInfo (deprecated) and is only a fallback
  const session = await createSession({
    directoryUrl: '/simple-directory',
    siteInfo: !window.__PUBLIC_SITE_INFO
  })

  // locale-independent options: Intl derives separators, decimal mark
  // and the space before the percent sign — same set registered for every session
  // language (an uncovered locale would fall back to the 'en' options with their
  // separators and an [intlify] warning)
  const numberFormats = {
    decimal: {},
    percent: { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }
  } as const
  const locales = ['fr', 'en', 'es', 'pt', 'it', 'de'] as const
  const numberFormatsByLocale = Object.fromEntries(locales.map(locale => [locale, numberFormats]))
  const i18n = createI18n({
    legacy: false,
    locale: session.lang.value,
    fallbackLocale: 'en',
    numberFormats: numberFormatsByLocale
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
