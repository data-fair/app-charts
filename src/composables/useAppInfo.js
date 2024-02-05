import axios from 'redaxios'
import debounce from 'debounce'
import { filters2qs } from '../assets/filters-utils'
import { reactive } from 'vue'

let instance = null

export default function useAppInfo() {
  if (instance) return instance

  const error = null
  const env = null
  const application = window.APPLICATION
  const data = null
  const conceptFilters = {}

  const defaultDataFairUrl = env ? new URL(env.defaultDataFair) : null
  const defaultConfigureUrl = env ? `${env.defaultDataFair}/applications?import=${encodeURIComponent(window.location.href)}` : null

  const incompleteConfig = (() => {
    if (!application) return false
    const config = application.configuration
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
  })()

  const config = application ? application.configuration : null

  function setAny(params) {
    Object.assign(appInfo, params)
  }

  function init(env) {
    setAny({ env })

    if (application) {
      const config = application.configuration
      if (config && config.dynamicFilters) {
        config.dynamicFilters.forEach(f => {
          f.values = f.defaultValues
        })
      }
    }
  }

  const fetchData = debounce(async function () {
    if (incompleteConfig) {
      return
    }

    const config = application.configuration
    if (config && config.dynamicFilters) {
      config.dynamicFilters.forEach(f => {
        const regex = new RegExp(`${f.field.key}_in=([^&]+)`)
        const match = window.location.search.match(regex)
        if (match && match[1]) {
          const queryParam = decodeURIComponent(match[1]).replace(/"/g, '')

          if (queryParam.startsWith('[') && queryParam.endsWith(']')) {
            try {
              f.values = JSON.parse(queryParam)
            } catch (e) {
              f.values = []
            }
          } else {
            if (queryParam.includes(',')) {
              f.values = queryParam.split(',').map(value => value.trim())
            } else {
              f.values = [queryParam]
            }
          }
        }
      })
    }

    if (config && config.dataType) {
      if (config.dataType.type === 'linesBased') {
        await fetchLinesData()
      } else {
        await fetchAggData()
      }
    }
  }, 10)

  async function fetchAggData() {
    const config = application.configuration

    const params = {
      field: config.dataType.groupBy.field.key,
      agg_size: config.dataType.groupBy.size,
      sort: config.dataType.sort,
      interval: config.dataType.groupBy.type === 'value' ? 'value' : config.dataType.groupBy.interval,
      qs: filters2qs((config.staticFilters).concat(config.dynamicFilters)),
      ...appInfo.conceptFilters,
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
      let response = await axios.get(`${config.datasets[0].href}/values_agg`, { params })
      if (response.data) response = response.data
      setAny({ data: response })
    } catch (err) {
      setError((err.response && err.response.data) || err.message)
    }
  }

  async function fetchLinesData() {
    const config = application.configuration

    const params = {
      select: config.dataType.valuesFields.map(f => f.key).concat([config.dataType.labelsField.key]).join(','),
      size: config.dataType.size,
      sort: (config.dataType.sortOrder === 'desc' ? '-' : '') + config.dataType.sortBy.key,
      qs: filters2qs((config.staticFilters).concat(config.dynamicFilters)),
      ...appInfo.conceptFilters,
      finalizedAt: config.datasets[0].finalizedAt // for better caching
    }

    try {
      let response = await axios.get(`${config.datasets[0].href}/lines`, { params })
      if (response.data) response = response.data
      setAny({ data: response })
    } catch (err) {
      setError(err)
    }
  }

  async function setError(error) {
    console.error(error)
    try {
      await axios.post(`${application.href}/error`, { message: error.message || error })
    } catch (postError) {
      console.error('Failed to report error', postError)
    }
  }

  const appInfo = reactive({
    error,
    env,
    application,
    data,
    conceptFilters,
    defaultDataFairUrl,
    defaultConfigureUrl,
    incompleteConfig,
    config,
    fetchData,
    init,
    setAny,
    setError
  })

  instance = appInfo
  return instance
}
