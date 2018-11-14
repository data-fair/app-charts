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
          (config.metricType !== 'count' && (!config.valueField || !config.valueField.key)) ||
          !config.groupBy || !config.groupBy.field || !config.groupBy.field.key
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
      fetchData: debounce(async function({ state, commit, dispatch }) {
        const config = state.application.configuration

        const params = {
          field: config.groupBy.field.key,
          agg_size: config.size,
          sort: config.sort
        }
        if (config.groupBy.interval) {
          params.interval = config.groupBy.interval
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
        } catch (err) {
          dispatch('setError', (err.response && err.response.data) || err.message)
        }
      }, 10),
      async setError({ state, commit }, error) {
        commit('setAny', { error })
        try {
          console.log(state.application.href)
          this.$axios.$post(state.application.href + '/error', { message: error.message || error })
        } catch (err) {
          console.log('Failed to report error', err)
        }
      }
    }
  })
}
