import { createPinia } from 'pinia'
import useMainStore from '@/stores/useMainStore'
import 'url-polyfill'

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

export default StorePlugin
