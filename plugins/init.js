// This plugin will init the store's content
require('url-polyfill')

export default ({ store, env, app }) => {
  window.vIframeOptions = { router: app.router, reactiveParams: true }
  store.dispatch('init', env)
}
