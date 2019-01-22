import Vue from 'vue'
import Vuex from 'vuex'
import debounce from 'debounce'
import { filters2qs } from '../assets/filters-utils'

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
        if (!config) return 'Configuration absente'
        if (!(config.datasets && config.datasets[0] && config.datasets[0].href)) {
          return 'Pas de jeu de données configuré'
        }
        if (config.chart.type === 'linesBased' && (!config.chart.valuesFields || !config.chart.valuesFields.length)) {
          return 'Pas de colonne avec valeur numérique à présenter dans la configuration'
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

          if (getters.config.filters && getters.config.filters.dynamicFilters) {
            getters.config.filters.dynamicFilters.forEach(f => {
              f.values = f.defaultValues
            })
          }
          if (!getters.incompleteConfig) {
            dispatch('fetchData')
          }
        }
      },
      fetchData: debounce(async function({ state, commit, dispatch }) {
        const config = state.application.configuration
        if (config.chart.type === 'linesBased') dispatch('fetchLinesData')
        else dispatch('fetchAggData')
      }, 10),
      async fetchAggData({ state, commit, dispatch }) {
        const config = state.application.configuration

        const params = {
          field: config.chart.groupBy.field.key,
          agg_size: config.chart.groupBy.size,
          sort: config.chart.sort
        }
        if (config.chart.groupBy.type !== 'value') {
          params.interval = config.chart.groupBy.interval
        }
        const rType = config.chart.render.type
        const twoLevels = rType.startsWith('stacked') || rType.startsWith('grouped') || rType.startsWith('multi')
        if (twoLevels) {
          params.field = `${params.field};${config.chart.render.secondGroupByField.key}`
          params.agg_size = `${params.agg_size};${config.chart.render.secondSize}`
        }
        if (config.chart.type === 'metricBased') {
          params.metric = config.chart.metricType
          params.metric_field = config.chart.valueField.key
        }
        params.qs = filters2qs((config.filters.staticFilters).concat(config.filters.dynamicFilters))

        try {
          const data = await this.$axios.$get(config.datasets[0].href + '/values_agg', { params })
          commit('setAny', { data })
        } catch (err) {
          dispatch('setError', (err.response && err.response.data) || err.message)
        }
      },
      async fetchLinesData({ state, commit, dispatch }) {
        const config = state.application.configuration

        const params = {
          select: config.chart.valuesFields.map(f => f.key).concat([config.chart.labelsField.key]).join(','),
          size: config.chart.size,
          sort: (config.chart.sortOrder === 'desc' ? '-' : '') + config.chart.sortBy.key
        }
        console.log('CONFIG', config)

        params.qs = filters2qs((config.filters.staticFilters).concat(config.filters.dynamicFilters))

        try {
          const data = await this.$axios.$get(config.datasets[0].href + '/lines', { params })
          commit('setAny', { data })
        } catch (err) {
          dispatch('setError', (err.response && err.response.data) || err.message)
        }
      },
      async setError({ state, commit }, error) {
        // commit('setAny', { error })
        console.error(error)
        try {
          this.$axios.$post(state.application.href + '/error', { message: error.message || error })
        } catch (err) {
          console.log('Failed to report error', err)
        }
      }
    }
  })
}
