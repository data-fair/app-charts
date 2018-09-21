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
      metricTypes: [
        {value: 'count', text: `Nombre de documents`},
        {value: 'min', text: 'Valeur min'},
        {value: 'max', text: 'Valeur max'},
        {value: 'sum', text: 'Somme'},
        {value: 'avg', text: 'Moyenne'}
      ],
      colors: ['#2196F3', '#E91E63', '#7E57C2', '#009688', '#00BCD4', '#EF6C00', '#4CAF50', '#FF9800', '#F44336', '#CDDC39', '#9C27B0', '#FFC107', '#3F51B5', '#795548', '#607D8B', '#FF9800', '#03A9F4', '#8BC34A', '#FFEB3B'],
      data: null
    },
    getters: {
      metricLabel(state, getters) {
        if (getters.incompleteConfig) return
        const metricType = state.metricTypes.find(m => m.value === getters.config.metricType)
        return metricType.text + ' de ' + getters.config.valueField.label
      },
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
      init({state, commit, dispatch, getters}, env) {
        commit('setAny', {env})
        if (state.application) {
          // hackish way of exposing a nuxt application on various base urls
          this.$router.options.base = this.$router.history.base = new URL(state.application.exposedUrl).pathname

          if (!getters.incompleteConfig) dispatch('fetchData')
        }
      },
      async fetchData({state, commit}) {
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
          const data = await this.$axios.$get(config.datasets[0].href + '/values_agg', {params})
          commit('setAny', {data})
        } catch (error) {
          commit('setAny', {error})
          console.error(error)
        }
      }
    }
  })
}
