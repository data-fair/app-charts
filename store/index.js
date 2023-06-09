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
      data: null,
      conceptFilters: {}
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
          return 'Pas de jeu de données configuré.'
        }
        if (config.dataType.type === 'linesBased' && (!config.dataType.valuesFields || !config.dataType.valuesFields.length)) {
          return 'Pas de colonnes de valeurs sélectionnées.'
        }
        if (config.dataType.type === 'metricBased' && !config.dataType.valueField) {
          return 'Pour ce type de préparation de données vous devez configurer la colonne sur laquelle effectuer un calcul.'
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

          if (getters.config && getters.config.dynamicFilters) {
            getters.config.dynamicFilters.forEach(f => {
              f.values = f.defaultValues
            })
          }
        }
      },
      fetchData: debounce(async function({ state, commit, dispatch, getters }) {
        if (getters.incompleteConfig) {
          return
        }
        if (getters.config && getters.config.dynamicFilters) {
          getters.config.dynamicFilters.forEach(f => {
            if (this.$router.currentRoute.query[`${f.field.key}_in`]) {
              Vue.set(f, 'values', JSON.parse(`[${this.$router.currentRoute.query[`${f.field.key}_in`]}]`))
            }
          })
        }
        const config = state.application.configuration
        if (config.dataType.type === 'linesBased') dispatch('fetchLinesData')
        else dispatch('fetchAggData')
      }, 10),
      async fetchAggData({ state, commit, dispatch }) {
        const config = state.application.configuration

        const params = {
          field: config.dataType.groupBy.field.key,
          agg_size: config.dataType.groupBy.size,
          sort: config.dataType.sort,
          interval: config.dataType.groupBy.type === 'value' ? 'value' : config.dataType.groupBy.interval,
          qs: filters2qs((config.staticFilters).concat(config.dynamicFilters)),
          ...state.conceptFilters,
          finalizedAt: config.datasets[0].finalizedAt // for better caching
        }

        if (config.dataType.type === 'metricBased') {
          params.metric = config.dataType.metricType
          params.metric_field = config.dataType.valueField.key
        }

        if (config.dataType.secondGroupBy && config.dataType.secondGroupBy.field && config.dataType.secondGroupBy.field.key) {
          params.field = `${params.field};${config.dataType.secondGroupBy.field.key}`
          params.agg_size = `${params.agg_size};${config.dataType.secondGroupBy.size}`
          params.interval = `${params.interval};${config.dataType.secondGroupBy.type === 'value' ? 'value' : config.dataType.secondGroupBy.interval}`
          if (config.dataType.secondSort) {
            params.sort = `${params.sort};${config.dataType.secondSort}`
          }
        }

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
          select: config.dataType.valuesFields.map(f => f.key).concat([config.dataType.labelsField.key]).join(','),
          size: config.dataType.size,
          sort: (config.dataType.sortOrder === 'desc' ? '-' : '') + config.dataType.sortBy.key,
          qs: filters2qs((config.staticFilters).concat(config.dynamicFilters)),
          ...state.conceptFilters,
          finalizedAt: config.datasets[0].finalizedAt // for better caching
        }

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
