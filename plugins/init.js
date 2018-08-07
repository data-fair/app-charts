// This plugin will init the stores from our dependencies
export default ({store, app, env}) => {
  store.dispatch('data-fair/init', {env})
}
