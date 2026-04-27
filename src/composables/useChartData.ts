import { computed, ref, watch, type Ref } from 'vue'
import { useDebounce } from '@vueuse/core'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import { useConceptFilters } from '@data-fair/lib-vue/concept-filters.js'
import { filters2qs } from '@data-fair/lib-utils/filters'
import { normalizeFilters } from '@/assets/utils'
import { useConfig } from '@/composables/config'
import type { ConfigState } from '@/composables/config'

import fetchRowsBasedData from './chart-data/rowsBased'
import fetchAggsBasedData from './chart-data/aggsBased'
import fetchAggsBasedLabelsData from './chart-data/aggsBasedLabels'
import fetchAggsLabelsData from './chart-data/aggsLabels'

export const displayError = ref(false)
export const errorMessage = ref('')

export interface ChartDataCtx {
  config: ConfigState['config']
  chart: ConfigState['chart']
  fields: ConfigState['fields']
  datasetUrl: ConfigState['datasetUrl']
  finalizedAt: ConfigState['finalizedAt']
  baseParams: Ref<any>
  getValue: (value: number | null | undefined) => number | undefined
  stacked: string | undefined
  metric: string | undefined
  categories: any[] | undefined
  displayError: Ref<boolean>
  errorMessage: Ref<string>
}

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
    const params: any = { ...conceptFilters }
    const qs = config.value.staticFilters?.length ? filters2qs(normalizeFilters(config.value.staticFilters)!).split(' AND ') : []
    if (qs.length) params.qs = qs.join(' AND ')
    return params
  }), 500)
  const getValue = (value: number | null | undefined) => value != null ? value / (config.value.divider ?? 1) : undefined

  let categories: any[] | undefined

  const ctx: ChartDataCtx = {
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
  } as ChartDataCtx

  const queryKey = computed(() => {
    const c = chart.value!.config
    return JSON.stringify({
      type: c.type,
      display: chart.value!.display,
      percentage: chart.value!.percentage,
      sumInTitle: chart.value!.sumInTitle,
      area: chart.value!.area,
      hidePoints: chart.value!.hidePoints,
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
      groupSortBy: c.groupSortBy,
      groupSortOrder: c.groupSortOrder,
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
      'reactiveSearchParams.group-sort-by': reactiveSearchParams['group-sort-by'],
      'reactiveSearchParams.group-sort-order': reactiveSearchParams['group-sort-order'],
      'reactiveSearchParams.stacked': reactiveSearchParams.stacked
    })
  })

  const getData = (theme: any) => ({
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
