// This plugin will init the store's content
require('url-polyfill')

export default ({ store, env }) => {
  store.dispatch('init', env)
}
