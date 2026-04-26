import { computed, ref, watch } from 'vue'
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

  watch(() => chart.value?.stacked, (stacked) => {
    if (stacked) reactiveSearchParams.stacked = reactiveSearchParams.stacked || 'true'
    else delete reactiveSearchParams.stacked
  }, { immediate: true })

  watch(config, () => {
    displayError.value = false
    errorMessage.value = ''
  }, { deep: true })

  const baseParams = useDebounce(computed(() => {
    const params = { ...conceptFilters }
    const qs = config.value.staticFilters?.length ? filters2qs(normalizeFilters(config.value.staticFilters)).split(' AND ') : []
    if (qs.length) params.qs = qs.join(' AND ')
    return params
  }), 500)
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
    get stacked () { return reactiveSearchParams.stacked },
    get metric () { return reactiveSearchParams.metric },
    get categories () { return categories }
  }

  const queryKey = computed(() => {
    const c = chart.value.config
    return JSON.stringify({
      type: c.type,
      display: chart.value.display,
      percentage: chart.value.percentage,
      sumInTitle: chart.value.sumInTitle,
      area: chart.value.area,
      hidePoints: chart.value.hidePoints,
      labelsField: c.labelsField,
      valuesField: c.valuesField,
      valuesFields: c.valuesFields,
      categoriesField: c.categoriesField,
      groupsField: c.groupsField,
      groupBy: c.groupBy,
      valuesLabel: c.valuesLabel,
      labelsValues: c.labelsValues,
      size: c.size,
      metric: c.metric,
      valueCalc: c.valueCalc,
      valuesCalc: c.valuesCalc,
      missingLabel: c.missingLabel,
      dynamicSort: c.dynamicSort,
      sortBy: c.sortBy,
      sortOrder: c.sortOrder,
      color: c.color,
      colors: c.colors,
      divider: config.value.divider,
      datasetId: config.value.datasets?.[0]?.id,
      finalizedAt: finalizedAt.value,
      staticFilters: JSON.stringify(config.value.staticFilters),
      baseParams: baseParams.value,
      'reactiveSearchParams.metric': reactiveSearchParams.metric,
      'reactiveSearchParams.sort-by': reactiveSearchParams['sort-by'],
      'reactiveSearchParams.sort-order': reactiveSearchParams['sort-order'],
      'reactiveSearchParams.stacked': reactiveSearchParams.stacked
    })
  })

  const getData = (theme) => ({
    rowsBased: async () => {
      displayError.value = false
      errorMessage.value = ''
      const result = await fetchRowsBasedData(ctx, theme)
      categories = result.categories
      return result
    },
    aggsBased: async () => {
      displayError.value = false
      errorMessage.value = ''
      return fetchAggsBasedData(ctx, theme)
    },
    aggsBasedLabels: async () => {
      displayError.value = false
      errorMessage.value = ''
      return fetchAggsBasedLabelsData(ctx, theme)
    },
    aggsLabels: async () => {
      displayError.value = false
      errorMessage.value = ''
      return fetchAggsLabelsData(ctx)
    }
  })

  return { getData, queryKey, displayError, errorMessage }
}
