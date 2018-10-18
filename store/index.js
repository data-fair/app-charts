import Vue from 'vue'
import Vuex from 'vuex'
import debounce from 'debounce'

Vue.use(Vuex)

export default () => {
  return new Vuex.Store({
    modules: {},
    state: {
      error: null,
      env: null,
      application: window.APPLICATION,
      data: null,
      filters: []
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
          !config ||
          !config.datasets || !config.datasets[0] || !config.datasets[0].href ||
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
      fetchData: debounce(async function({ state, commit }) {
        const config = state.application.configuration

        const params = {
          field: config.groupByField.key,
          agg_size: config.size,
          sort: config.sort
        }
        if (config.chart && config.chart.secondGroupByField) {
          params.field = `${params.field};${config.chart.secondGroupByField.key}`
        }
        if (config.metricType !== 'count') {
          params.metric = config.metricType
          params.metric_field = config.valueField.key
        }

        const filters = {};
        (config.staticFilters || []).forEach(sf => {
          filters[sf.field.key] = sf.value
        })
        state.filters.forEach(f => {
          filters[f.field.key] = f.value
        })
        params.qs = Object.keys(filters)
          .filter(key => ![null, undefined, ''].includes(filters[key]))
          .map(key => `${key}:${filters[key]}`).join(' AND ')

        try {
          const data = await this.$axios.$get(config.datasets[0].href + '/values_agg', { params })
          commit('setAny', { data })
        } catch (error) {
          commit('setAny', { error })
        }
      }, 10),
      setError({ commit }, error) {
        commit('setAny', { error })
      }
    }
  })
}
