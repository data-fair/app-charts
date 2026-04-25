import { computed, ref } from 'vue'
import { useDebounce } from '@vueuse/core'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import { useConceptFilters } from '@data-fair/lib-vue/concept-filters.js'
import { filters2qs } from '@data-fair/lib-utils/filters'
import { normalizeFilters } from '@/assets/utils'
import { useConfig } from '@/composables/config'

import fetchRowsBasedData from './chart-data/rowsBased.js'
import fetchAggsBasedData from './chart-data/aggsBased.js'
import fetchAggsBasedLabelsData from './chart-data/aggsBasedLabels.js'
import fetchAggsLabelsData from './chart-data/aggsLabels.js'

export const displayError = ref(false)
export const errorMessage = ref('')

export function useChartData () {
  const { config, dataset, chart, datasetUrl, fields, finalizedAt } = useConfig()
  const conceptFilters = useConceptFilters(reactiveSearchParams, dataset.value?.id)

  if (chart.value?.stacked) reactiveSearchParams.stacked = reactiveSearchParams.stacked || 'true'
  else delete reactiveSearchParams.stacked

  function getParams (ignoreField) {
    return useDebounce(computed(() => {
      const params = { ...conceptFilters }
      if (ignoreField) delete params[`_d_${config.value.datasets?.[0]?.id}_${ignoreField}_in`]
      const qs = config.value.staticFilters?.length ? filters2qs(normalizeFilters(config.value.staticFilters)).split(' AND ') : []
      if (qs.length) params.qs = qs.join(' AND ')
      return params
    }), 500)
  }

  const baseParams = getParams()
  const getValue = (value) => value != null ? value / config.value.divider : undefined

  let categories

  const ctx = {
    config,
    chart,
    fields,
    datasetUrl,
    finalizedAt,
    baseParams,
    getValue,
    displayError,
    errorMessage,
    get categories () { return categories }
  }

  const getData = (theme) => ({
    rowsBased: async () => {
      const result = await fetchRowsBasedData(ctx, theme)
      categories = result.categories
      return result
    },
    aggsBased: async () => fetchAggsBasedData(ctx, theme),
    aggsBasedLabels: async () => fetchAggsBasedLabelsData(ctx, theme),
    aggsLabels: async () => fetchAggsLabelsData(ctx)
  })

  return { getData, displayError, errorMessage }
}
