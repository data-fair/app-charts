// This plugin will init the store's content
export default ({store, env}) => {
  store.dispatch('init', env)
}
