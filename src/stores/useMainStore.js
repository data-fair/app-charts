import { defineStore } from 'pinia'
import { filters2qs } from '../assets/filters-utils'
import axios from 'axios'
import debounce from 'debounce'
import router from '../router/index.js'

const useMainStore = defineStore('main', {
  state: () => ({
    error: null,
    env: null,
    application: window.APPLICATION,
    data: null,
    conceptFilters: {}
  }),
  getters: {
    defaultDataFairUrl: (state) => new URL(state.env.defaultDataFair),
    defaultConfigureUrl: (state) => state.env.defaultDataFair + '/applications?import=' + encodeURIComponent(window.location.href),
    incompleteConfig: (state) => {
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
    config: (state) => state.application && state.application.configuration
  },
  actions: {
    setAny(params) {
      Object.assign(this, params)
    },
    init(env) {
      this.setAny({ env })

      if (this.application) {
        router.options.base = router.history.base = new URL(this.application.exposedUrl).pathname

        const config = this.config
        if (config && config.dynamicFilters) {
          config.dynamicFilters.forEach(f => {
            f.values = f.defaultValues
          })
        }
      }
    },
    fetchData: debounce(async function() {
      if (this.incompleteConfig) {
        return
      }

      const config = this.config
      if (config && config.dynamicFilters) {
        config.dynamicFilters.forEach(f => {
          const queryParam = router.currentRoute.value.query[`${f.field.key}_in`]
          if (queryParam) {
            f.values = JSON.parse(`[${queryParam}]`)
          }
        })
      }

      if (config && config.dataType) {
        if (config.dataType.type === 'linesBased') {
          await this.fetchLinesData()
        } else {
          await this.fetchAggData()
        }
      }
    }, 10),
    async fetchAggData() {
      const config = this.application.configuration

      const params = {
        field: config.dataType.groupBy.field.key,
        agg_size: config.dataType.groupBy.size,
        sort: config.dataType.sort,
        interval: config.dataType.groupBy.type === 'value' ? 'value' : config.dataType.groupBy.interval,
        qs: filters2qs((config.staticFilters).concat(config.dynamicFilters)),
        ...this.conceptFilters,
        finalizedAt: config.datasets[0].finalizedAt // for better caching
      }

      if (config.dataType.type === 'metricBased') {
        params.metric = config.dataType.metricType
        params.metric_field = config.dataType.valueField.key
      }

      if (config.dataType.secondGroupBy && config.dataType.secondGroupBy.field && config.dataType.secondGroupBy.field.key) {
        params.field = `${params.field}${config.dataType.secondGroupBy.field.key}`
        params.agg_size = `${params.agg_size}${config.dataType.secondGroupBy.size}`
        params.interval = `${params.interval}${config.dataType.secondGroupBy.type === 'value' ? 'value' : config.dataType.secondGroupBy.interval}`
        if (config.dataType.secondSort) {
          params.sort = `${params.sort}${config.dataType.secondSort}`
        }
      }

      try {
        const data = await axios.get(config.datasets[0].href + '/values_agg', { params })
        this.setAny({ data })
      } catch (err) {
        this.setError((err.response && err.response.data) || err.message)
      }
    },
    async fetchLinesData() {
      const config = this.application.configuration

      const params = {
        select: config.dataType.valuesFields.map(f => f.key).concat([config.dataType.labelsField.key]).join(','),
        size: config.dataType.size,
        sort: (config.dataType.sortOrder === 'desc' ? '-' : '') + config.dataType.sortBy.key,
        qs: filters2qs((config.staticFilters).concat(config.dynamicFilters)),
        ...this.conceptFilters,
        finalizedAt: config.datasets[0].finalizedAt // for better caching
      }

      try {
        const data = await axios.get(config.datasets[0].href + '/lines', { params })
        this.setAny({ data })
      } catch (err) {
        this.setError((err.response && err.response.data) || err.message)
      }
    },
    async setError(error) {
      console.error(error)
      try {
        await axios.post(this.application.href + '/error', { message: error.message || error })
      } catch (err) {
        console.log('Failed to report error', err)
      }
    }
  }
})

export default useMainStore
