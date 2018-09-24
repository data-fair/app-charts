import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default () => {
  return new Vuex.Store({
    modules: {},
    state: {
      error: null,
      env: null,
      application: window.APPLICATION,

      data: null
    },
    getters: {
      defaultDataFairUrl(state) {
        return new URL(state.env.defaultDataFair)
      },
      defaultConfigureUrl(state) {
        return state.env.defaultDataFair + '/applications?import=' + encodeURIComponent(window.location.href)
      },
      incompleteConfig(state) {
        if (!state.application) return false
        const config = state.application.configuration
        if (
          !config.datasets[0] || !config.datasets[0].href ||
          !config.valueField || !config.valueField.key ||
          !config.groupByField || !config.groupByField.key
        ) {
          return true
        }
        return false
      },
      config(state) {
        return state.application && state.application.configuration
      }
    },
    mutations: {
      setAny(state, params) {
        Object.assign(state, params)
      }
    },
    actions: {
      init({ state, commit, dispatch, getters }, env) {
        commit('setAny', { env })
        if (state.application) {
          // hackish way of exposing a nuxt application on various base urls
          this.$router.options.base = this.$router.history.base = new URL(state.application.exposedUrl).pathname

          if (!getters.incompleteConfig) dispatch('fetchData')
        }
      },
      async fetchData({ state, commit }) {
        const config = state.application.configuration

        const params = {
          field: config.groupByField.key,
          agg_size: 10
        }
        if (config.metricType !== 'count') {
          params.metric = config.metricType
          params.metric_field = config.valueField.key
        }
        try {
          const data = await this.$axios.$get(config.datasets[0].href + '/values_agg', { params })
          commit('setAny', { data })
        } catch (error) {
          commit('setAny', { error })
          console.error(error)
        }
      },
      setError({ commit }, error) {
        commit('setAny', { error })
      }
    }
  })
}
