import debounce from 'debounce'
import getReactiveSearchParams from '@data-fair/lib/vue/reactive-search-params-global.js'
import { filters2qs } from '../assets/filters-utils'
import { ofetch } from 'ofetch'
import { reactive, watch } from 'vue'
import { useConceptFilters } from '@data-fair/lib/vue/concept-filters.js'

let /** @type {any} */ instance = null

export default function useAppInfo() {
  if (instance) return instance

  const env = null
  // @ts-ignore
  const application = /** @type {import('@data-fair/lib/shared/application.js').Application} */ window.APPLICATION
  const data = null
  const searchParams = getReactiveSearchParams
  const conceptFilters = useConceptFilters(searchParams)

  let defaultDataFairUrl = null
  let defaultConfigureUrl = null

  const incompleteConfig = (() => {
    if (!application) return null
    const config = /** @type {import('../config/.type/types.js').Config | undefined} */ application.configuration
    if (!config) throw new Error('Configuration absente')
    if (!(config.datasets && config.datasets[0] && config.datasets[0].href)) {
      throw new Error('Pas de jeu de données configuré.')
    }
    if (config.dataType.type === 'linesBased' && (!config.dataType.valuesFields || !config.dataType.valuesFields.length)) {
      throw new Error('Pas de colonnes de valeurs sélectionnées.')
    }
    if (config.dataType.type === 'metricBased' && !config.dataType.valueField) {
      throw new Error('Pour ce type de préparation de données vous devez configurer la colonne sur laquelle effectuer un calcul.')
    }
    return config
  })()

  const config = incompleteConfig

  /**
   * @param {Record<string, any>} params
   */
  function setAny(params) {
    Object.assign(appInfo, params)
  }

  /**
   * @param {Record<string, any>} env
   */
  function init(env) {
    setAny({ env })

    defaultDataFairUrl = env ? new URL(env.defaultDataFairUrl) : null
    defaultConfigureUrl = env ? `${env.defaultDataFairUrl}/applications?import=${encodeURIComponent(window.location.href)}` : null

    if (application) {
      const config = application.configuration
      if (config && config.dynamicFilters) {
        config.dynamicFilters.forEach(/** @param {Record<string, any>} f */ f => {
          f.values = f.defaultValues
        })
      }
    }
  }

  const fetchData = debounce(async function () {
    if (incompleteConfig === null) {
      return
    }

    const config = application.configuration
    if (config && config.dynamicFilters) {
      config.dynamicFilters.forEach(/** @param {Record<string, any>} f */ f => {
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
      ...conceptFilters.conceptFilters.value,
      finalizedAt: config.datasets[0].finalizedAt // for better caching
    }

    if (config.dataType.type === 'metricBased') {
      // @ts-ignore
      params.metric = config.dataType.metricType
      // @ts-ignore
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

    const response = await ofetch(`${config.datasets[0].href}/values_agg`, { params }).catch(err => {
      setError(err)
    })
    setAny({ data: response })
  }

  async function fetchLinesData() {
    const config = application.configuration

    const params = {
      select: config.dataType.valuesFields.map(/** @param {Record<string, any>} f */ f => f.key).concat([config.dataType.labelsField.key]).join(','),
      size: config.dataType.size,
      sort: (config.dataType.sortOrder === 'desc' ? '-' : '') + config.dataType.sortBy.key,
      qs: filters2qs((config.staticFilters).concat(config.dynamicFilters)),
      ...conceptFilters.conceptFilters.value,
      finalizedAt: config.datasets[0].finalizedAt // for better caching
    }

    const response = await ofetch(`${config.datasets[0].href}/lines`, { params }).catch(err => {
      setError(err)
    })
    setAny({ data: response })
  }

  watch(searchParams, fetchData, { deep: true })
  watch(conceptFilters.conceptFilters, fetchData, { deep: true })

  async function setError(/** @type {any} */ error) {
    console.error(error)
    await ofetch(`${application.href}/error`, {
      method: 'POST',
      body: {
        message: error.message || error
      }
    }).catch(postError => {
      console.error('Failed to report error', postError)
    })
  }

  const appInfo = reactive({
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
