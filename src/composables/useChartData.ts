import { computed, ref, watch, watchEffect } from 'vue'
import { useDebounce } from '@vueuse/core'
import { useTheme } from 'vuetify'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import { useConceptFilters } from '@data-fair/lib-vue/concept-filters.js'
import { useFetch } from '@data-fair/lib-vue/fetch.js'
import { useUiNotif, getErrorMsg } from '@data-fair/lib-vue/ui-notif.js'
import { filters2qs } from '@data-fair/lib-utils/filters'
import { ofetch } from 'ofetch'
import { normalizeFilters } from '@/assets/utils'
import { useConfig } from '@/composables/config'

import transformRowsBased from './chart-data/rowsBased'
import transformAggsBased from './chart-data/aggsBased'
import transformAggsBasedLabels from './chart-data/aggsBasedLabels'
import transformAggsLabels from './chart-data/aggsLabels'

export interface DatasetLine {
  [key: string]: unknown
}

export interface AggItem {
  value: string | number
  total?: number
  metric?: number
  aggs?: AggItem[]
}

export interface ValuesAggResponse {
  aggs: AggItem[]
}

export interface LinesResponse {
  results: DatasetLine[]
}

export interface MetricAggResponse {
  metric: number
}

export interface ValuesLabelsItem {
  value: string
  label: string
}

export function useChartData () {
  const { config, dataset, chart, datasetUrl, finalizedAt, fields } = useConfig()
  const theme = useTheme()
  const { sendUiNotif } = useUiNotif()
  const conceptFilters = useConceptFilters(reactiveSearchParams, dataset.value?.id)

  // Keep stacked search param in sync with chart default
  watch(() => chart.value?.stacked, (stacked) => {
    if (stacked) reactiveSearchParams.stacked = reactiveSearchParams.stacked || 'true'
    else delete reactiveSearchParams.stacked
  }, { immediate: true })

  const baseParams = useDebounce(computed(() => {
    const params: Record<string, string> = { ...conceptFilters }
    const qs = config.value.staticFilters?.length
      ? filters2qs(normalizeFilters(config.value.staticFilters as any) as any).split(' AND ')
      : []
    if (qs.length) params.qs = qs.join(' AND ')
    return params
  }), 500)

  const getValue = (value: number | null | undefined) => value != null ? value / (config.value.divider ?? 1) : undefined

  // ──────────────────────────────────────────────────────────────────
  // Reactive mode selector
  // ──────────────────────────────────────────────────────────────────
  const mode = computed(() => {
    const t = chart.value?.config?.type
    if (!t) return null
    return t.replace('Categories', '')
  })
  const isRowsBased = computed(() => mode.value === 'rowsBased')
  const isAggsBased = computed(() => mode.value === 'aggsBased')
  const isAggsBasedLabels = computed(() => mode.value === 'aggsBasedLabels')
  const isAggsLabels = computed(() => mode.value === 'aggsLabels')

  // ──────────────────────────────────────────────────────────────────
  // /values_agg  (aggsBased + aggsBasedLabels)
  // ──────────────────────────────────────────────────────────────────
  const aggsUrl = computed(() => {
    if (!datasetUrl.value) return null
    if (isAggsBased.value) {
      if (!chart.value!.config.groupBy) return null
      return `${datasetUrl.value}/values_agg`
    }
    if (isAggsBasedLabels.value) {
      if (!chart.value!.config.valuesLabel) return null
      return `${datasetUrl.value}/values_agg`
    }
    return null
  })
  const aggsQuery = computed(() => {
    if (!aggsUrl.value) return null
    const c = chart.value!.config
    const sortBy = reactiveSearchParams['sort-by']
    if (isAggsBased.value) {
      return {
        ...baseParams.value,
        size: 0,
        field: c.groupBy.field,
        interval: c.groupBy.interval || 'value',
        agg_size: chart.value!.type === 'pie' ? 1000 : c.size,
        sort: buildSort(c, sortBy || c.aggSortBy),
        finalizedAt: finalizedAt.value,
        ...aggExtraMetrics(c, sortBy)
      }
    }
    // aggsBasedLabels
    return {
      ...baseParams.value,
      size: 0,
      field: c.valuesLabel,
      sort: c.valuesLabel,
      agg_size: c.size,
      metric: reactiveSearchParams.metric || c.metric,
      metric_field: c.labelsValues?.[0],
      finalizedAt: finalizedAt.value,
      ...(c.labelsValues?.length > 1
        ? { extra_metrics: c.labelsValues.slice(1).map((v: string) => v + ':' + c.metric).join(',') }
        : {})
    }
  })
  const { data: aggsRaw, error: aggsError } = useFetch<ValuesAggResponse>(aggsUrl, { query: aggsQuery as any, notifError: false })

  // ──────────────────────────────────────────────────────────────────
  // /values-labels/<categoriesField>  (rowsBased with categoriesField)
  // ──────────────────────────────────────────────────────────────────
  const categoriesUrl = computed(() => {
    if (!isRowsBased.value || !datasetUrl.value) return null
    const cf = chart.value!.config.categoriesField
    if (!cf) return null
    return `${datasetUrl.value}/values-labels/${cf}`
  })
  const { data: categoriesRaw, error: categoriesError } = useFetch<ValuesLabelsItem[]>(categoriesUrl, { notifError: false })

  // ──────────────────────────────────────────────────────────────────
  // /lines  (rowsBased)
  // ──────────────────────────────────────────────────────────────────
  const linesUrl = computed(() => {
    if (!isRowsBased.value || !datasetUrl.value) return null
    return `${datasetUrl.value}/lines`
  })
  const linesQuery = computed(() => {
    if (!isRowsBased.value) return null
    const c = chart.value!.config
    const select = [c.labelsField!].concat(c.valuesField || c.valuesFields || [])
    if (c.categoriesField) select.push(c.categoriesField)
    return {
      ...baseParams.value,
      size: chart.value!.type === 'pie' ? 10000 : c.size,
      sort: buildSort(c, reactiveSearchParams['sort-by'] || c.rowSortBy),
      finalizedAt: finalizedAt.value,
      select: select.join(',')
    }
  })
  const { data: linesRaw, error: linesError } = useFetch<LinesResponse>(linesUrl, { query: linesQuery as any, notifError: false })

  // ──────────────────────────────────────────────────────────────────
  // /metric_agg  (aggsLabels: N parallel calls, one per valuesField)
  // useFetch only supports a single URL per call, so for this mode we
  // do parallel ofetch calls inside a watchEffect. Reactivity is preserved
  // through the explicit dependencies.
  // ──────────────────────────────────────────────────────────────────
  const aggsLabelsMetrics = ref<Array<{ field: string; metric: number }>>([])
  watchEffect(async () => {
    if (!isAggsLabels.value || !datasetUrl.value) {
      aggsLabelsMetrics.value = []
      return
    }
    const fields = (chart.value?.config?.valuesFields || []) as string[]
    if (!fields.length) {
      aggsLabelsMetrics.value = []
      return
    }
    const params = {
      ...baseParams.value,
      metric: 'sum',
      finalizedAt: finalizedAt.value
    }
    try {
      const       results = await Promise.all(fields.map((field) =>
        ofetch<MetricAggResponse>(`${datasetUrl.value}/metric_agg`, { params: { ...params, field } })
          .then((r) => ({ field, metric: r.metric }))
          .catch((e) => {
            sendUiNotif({ type: 'error', msg: getErrorMsg(e), error: e })
            return { field, metric: 0 }
          })
      ))
      aggsLabelsMetrics.value = results
    } catch {
      aggsLabelsMetrics.value = []
    }
  })

  // ──────────────────────────────────────────────────────────────────
  // Global error handling -> global notification (<DfUiNotif />)
  // ──────────────────────────────────────────────────────────────────
  watch([aggsError, categoriesError, linesError], ([ae, ce, le]) => {
    const first = ae || ce || le
    if (first) {
      sendUiNotif({ type: 'error', msg: getErrorMsg(first), error: first })
    }
  })

  // ──────────────────────────────────────────────────────────────────
  // Reactive transform: API responses -> Chart.js data
  // ──────────────────────────────────────────────────────────────────
  const data = computed<{ labels: any; datasets: any[] } | null>(() => {
    if (!mode.value || !chart.value || !config.value) return null
    const sortBy = reactiveSearchParams['sort-by']
    const sortOrder = reactiveSearchParams['sort-order']

    if (isRowsBased.value) {
      if (!linesRaw.value) return null
      return transformRowsBased({
        config: config.value,
        chart: chart.value,
        fields: fields.value,
        finalizedAt: finalizedAt.value,
        baseParams: baseParams.value,
        getValue,
        stacked: reactiveSearchParams.stacked,
        theme: { colors: theme.current.value.colors as unknown as Record<string, string> },
        sortBy,
        sortOrder,
        results: linesRaw.value.results,
        categories: categoriesRaw.value
      })
    }
    if (isAggsBased.value) {
      if (!aggsRaw.value) return null
      return transformAggsBased({
        config: config.value,
        chart: chart.value,
        fields: fields.value,
        finalizedAt: finalizedAt.value,
        baseParams: baseParams.value,
        getValue,
        stacked: reactiveSearchParams.stacked,
        metric: reactiveSearchParams.metric,
        theme: { colors: theme.current.value.colors as unknown as Record<string, string> },
        sortBy,
        sortOrder,
        aggs: aggsRaw.value.aggs
      })
    }
    if (isAggsBasedLabels.value) {
      if (!aggsRaw.value) return null
      return transformAggsBasedLabels({
        config: config.value,
        chart: chart.value,
        fields: fields.value,
        finalizedAt: finalizedAt.value,
        baseParams: baseParams.value,
        getValue,
        stacked: reactiveSearchParams.stacked,
        metric: reactiveSearchParams.metric,
        aggs: aggsRaw.value.aggs
      })
    }
    if (isAggsLabels.value) {
      if (!aggsLabelsMetrics.value.length) return null
      return transformAggsLabels({
        config: config.value,
        chart: chart.value,
        fields: fields.value,
        finalizedAt: finalizedAt.value,
        baseParams: baseParams.value,
        metric: reactiveSearchParams.metric,
        getValue,
        metrics: aggsLabelsMetrics.value
      })
    }
    return null
  })

  return {
    data
  }
}

function buildSort (c: any, sortBy: string | undefined): string | undefined {
  if (!sortBy) return undefined
  const sortOrder = reactiveSearchParams['sort-order'] || c.sortOrder
  let str = (sortOrder === 'desc' ? '-' : '')
  if (sortBy === 'value') {
    if (c.valuesField || c.valuesFields?.[0]) {
      str += (c.valuesField || c.valuesFields?.[0])
    } else {
      str += (c.valueCalc?.type || 'metric')
    }
  } else if (sortBy === 'label') {
    str += (c.labelsField || (c.groupBy && c.groupBy.field))
  } else if (sortBy === 'row') {
    str += '_i'
  }
  return str || undefined
}

function aggExtraMetrics (c: any, sortBy: string | undefined) {
  if (c.valueCalc?.type === 'metric' || c.valuesCalc) {
    const out: Record<string, string> = {}
    const sortField = sortBy === 'value' ? (reactiveSearchParams['sort-field'] || c.sortField) : undefined
    out.metric_field = sortField || c.valuesCalc?.[0] || c.valueCalc?.field
    if (c.valuesCalc?.length > 1) {
      const extraMetrics = c.valuesCalc
        .filter((v: string) => v !== out.metric_field)
        .map((v: string) => v + ':' + c.metric)
      if (extraMetrics.length) out.extra_metrics = extraMetrics.join(',')
    }
    return out
  }
  return {}
}
