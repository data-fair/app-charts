import useMainStore from '@/stores/useMainStore'
import 'url-polyfill'

export function useInit(env, router) {
  const store = useMainStore()
  window.vIframeOptions = { router, reactiveParams: true }
  store.init(env)
}
