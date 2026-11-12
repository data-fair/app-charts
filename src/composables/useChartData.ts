import type { Filter } from '@data-fair/lib-utils/filters'
import type { DividerConfig } from '@/assets/utils'
import { computed, ref, watch, watchEffect } from 'vue'
import { useDebounce } from '@vueuse/core'
import { useTheme } from 'vuetify'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import { getConceptFilters } from '@data-fair/lib-vue/concept-filters.js'
import { targetExcludeKeys } from '@data-fair/lib-vue/selection.js'
import { useFetch } from '@data-fair/lib-vue/fetch.js'
import { useUiNotif, getErrorMsg } from '@data-fair/lib-vue/ui-notif.js'
import { filters2params } from '@data-fair/lib-utils/filters'
import { ofetch } from 'ofetch'
import { normalizeFilters, normalizeDivider, extractDividerValue, stackedParam } from '@/assets/utils'
import { applySelectionHighlight, resolveSelectionTarget } from '@/assets/selection'
import { useChartSelection } from '@/composables/useChartSelection'
import { useConfig } from '@/composables/config'
import transformRowsBased from './chart-data/rowsBased'
import transformAggsBased from './chart-data/aggsBased'
import transformAggsBasedLabels from './chart-data/aggsBasedLabels'
import transformAggsLabels from './chart-data/aggsLabels'

export interface DatasetLine {
  [key: string]: unknown
}

export interface AggItem {
  // boolean fields return their values as is (true/false)
  value: string | number | boolean
  total?: number
  metric?: number
  aggs?: AggItem[]
  // additional metric fields returned by the API (`<field>_<metric>: number`)
  [key: string]: unknown
}

export interface ValuesAggResponse {
  aggs: AggItem[]
}

export interface LinesResponse {
  totalCount?: number
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

  // The declared selection field (x-axis) is never a restriction: its
  // `_c_`/`_d_` keys are removed from API requests by the visualization itself.
  const selectionTarget = computed(() => resolveSelectionTarget(chart.value, dataset.value, fields.value))
  const conceptFilters = computed(() => {
    const input = { ...reactiveSearchParams }
    if (selectionTarget.value) {
      for (const key of targetExcludeKeys(reactiveSearchParams, selectionTarget.value)) delete input[key]
    }
    return getConceptFilters(input, dataset.value?.id)
  })

  // Keep stacked search param in sync with chart default. When the toggle is
  // disabled (`disableDynamicStack`), the config rules and a leftover
  // parameter is purged: there is no UI left to correct it.
  watch([() => chart.value?.stacked, () => chart.value?.disableDynamicStack], ([stacked, disabled]) => {
    const next = stackedParam(stacked, disabled, reactiveSearchParams.stacked)
    if (next === undefined) delete reactiveSearchParams.stacked
    else reactiveSearchParams.stacked = next
  }, { immediate: true })

  const baseParams = useDebounce(computed(() => {
    // predefined filters as suffixed REST parameters (_in, _nin, _gte...), never as `qs`
    const params: Record<string, string> = {
      ...conceptFilters.value,
      ...(config.value.staticFilters?.length
        ? filters2params(normalizeFilters(config.value.staticFilters as any) as Filter[])
        : {})
    }
    return params
  }), 500)

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
  // Global multiplier (unit change) and chart divider
  // The legacy global numeric « divider » format (before the redesign) is
  // interpreted as a fallback as a 1/N multiplier (v/N ≡ v × (1/N)).
  // ──────────────────────────────────────────────────────────────────
  const divisor = computed<DividerConfig>(() => {
    const d = normalizeDivider(chart.value?.config?.divider)
    // without groups (row-by-row reading, global metrics), the
    // « number of rows in the group » does not exist: fall back to the total
    if (d.type === 'groupCount' && (isRowsBased.value || isAggsLabels.value)) {
      return { type: 'totalCount' }
    }
    return d
  })
  const multiplier = computed(() => {
    const m = config.value?.multiplier
    if (typeof m === 'number' && Number.isFinite(m)) return m
    const legacy = (config.value as { divider?: unknown } | undefined)?.divider
    if (typeof legacy === 'number' && Number.isFinite(legacy) && legacy !== 0) return 1 / legacy
    return 1
  })

  // ──────────────────────────────────────────────────────────────────
  // Total number of rows (totalCount divider):
  // - rowsBased: totalCount returned by /lines (no call)
  // - aggregate modes: /metric_agg?metric=value_count on the
  //   grouping field, same filters (baseParams) as the chart
  // ──────────────────────────────────────────────────────────────────
  const globalCount = ref<number>()
  watchEffect(async () => {
    globalCount.value = undefined
    if (isRowsBased.value || !datasetUrl.value) return
    if (divisor.value.type !== 'totalCount') return
    const c = chart.value?.config
    const field = isAggsBased.value
      ? c?.groupBy?.field
      : isAggsBasedLabels.value
        ? c?.valuesLabel
        : c?.valuesFields?.[0]
    if (!field) return
    try {
      globalCount.value = (await ofetch<MetricAggResponse>(`${datasetUrl.value}/metric_agg`, {
        params: { ...baseParams.value, field, metric: 'value_count', finalizedAt: finalizedAt.value }
      })).metric
    } catch (e) {
      sendUiNotif({ type: 'error', msg: getErrorMsg(e as Error), error: e })
    }
  })

  // Total number of rows of the filtered dataset (totalCount divider):
  // - rowsBased: totalCount returned by /lines
  // - aggregate modes: /metric_agg?metric=value_count (watchEffect globalCount)
  function getTotalCount (): number | undefined {
    if (isRowsBased.value) return linesRaw.value?.totalCount
    return globalCount.value
  }

  // Applies multiplier and divider. `source` carries the division value:
  // row (/lines), aggregate item (/values_agg) or already aggregated number
  // (global /metric_agg). Without a usable divider, the value is hidden.
  const getValue = (value: number | null | undefined, source?: unknown) => {
    if (value == null) return undefined
    const type = divisor.value.type
    if (type === 'none') {
      const v = value * multiplier.value
      return Number.isFinite(v) ? v : undefined
    }
    const d = type === 'totalCount'
      ? getTotalCount()
      : extractDividerValue(source, divisor.value)
    if (d === undefined || d === 0) return undefined
    const v = (value * multiplier.value) / d
    return Number.isFinite(v) ? v : undefined
  }

  // Division column missing from the schema (obsolete config) → warning
  watch(divisor, (d) => {
    if (d.type === 'column' && !fields.value[d.field!]) {
      sendUiNotif({ type: 'error', msg: `Le diviseur est configuré sur la colonne « ${d.field} », absente du jeu de données.` })
    }
  }, { immediate: true })

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
      const query: Record<string, any> = {
        ...baseParams.value,
        size: 0,
        field: c.groupBy.field,
        interval: c.groupBy.interval || 'value',
        agg_size: chart.value!.type === 'pie' ? 1000 : c.size,
        sort: buildSort(c, sortBy || c.aggSortBy),
        finalizedAt: finalizedAt.value,
        ...aggExtraMetrics(c, sortBy)
      }
      // missing values bucket (configured label)
      if (c.missingLabel) query.missing = c.missingLabel
      // sub-series by groupsField: 2nd aggregation dimension, data-fair convention
      // of parallel `,` params (field=a,b, agg_size=n,12, sort=x,-metric)
      if (c.groupsField) {
        query.field = [query.field, c.groupsField].join(',')
        query.agg_size = [query.agg_size, '12'].join(',')
        if (query.sort) query.sort = [query.sort, '-' + (c.valueCalc?.type || 'metric')].join(',')
      }
      // the divider is aggregated in the same values_agg as the chart value
      if (divisor.value.type === 'column') {
        query.extra_metrics = mergeExtraMetrics(query.extra_metrics, `${divisor.value.field}:${divisor.value.metric}`)
      }
      return query
    }
    // aggsBasedLabels
    const labelsValues: string[] = c.labelsValues || []
    const metric = reactiveSearchParams.metric || c.metric
    const labelsQuery: Record<string, any> = {
      ...baseParams.value,
      size: 0,
      field: c.valuesLabel,
      sort: c.valuesLabel,
      agg_size: c.size,
      metric,
      metric_field: labelsValues[0],
      finalizedAt: finalizedAt.value
    }
    const extra = mergeExtraMetrics(
      labelsValues.length > 1
        ? labelsValues.slice(1).map((v: string) => v + ':' + metric).join(',')
        : undefined,
      // a column without any value returns 0 with sum: its count of
      // values distinguishes it from a real 0 (see aggsBasedLabels)
      labelsValues.map((v: string) => v + ':value_count').join(','),
      // targets from the data: average of the series rows
      (c.objectifFields || []).map((v: string) => v + ':avg').join(',') || undefined,
      divisor.value.type === 'column' ? `${divisor.value.field}:${divisor.value.metric}` : undefined
    )
    if (extra) labelsQuery.extra_metrics = extra
    return labelsQuery
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
    // row-by-row reading: the division column is read on each row
    if (divisor.value.type === 'column' && !select.includes(divisor.value.field!)) select.push(divisor.value.field!)
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
  // « column » divider aggregated globally (a single /metric_agg, same filters)
  const divisorMetric = ref<number>()
  watchEffect(async () => {
    if (!isAggsLabels.value || !datasetUrl.value) {
      aggsLabelsMetrics.value = []
      divisorMetric.value = undefined
      return
    }
    const fields = (chart.value?.config?.valuesFields || []) as string[]
    if (!fields.length) {
      aggsLabelsMetrics.value = []
      divisorMetric.value = undefined
      return
    }
    const params = {
      ...baseParams.value,
      metric: 'sum',
      finalizedAt: finalizedAt.value
    }
    try {
      const results = await Promise.all(fields.map((field) =>
        ofetch<MetricAggResponse>(`${datasetUrl.value}/metric_agg`, { params: { ...params, field } })
          .then((r) => ({ field, metric: r.metric }))
          .catch((e) => {
            sendUiNotif({ type: 'error', msg: getErrorMsg(e), error: e })
            return { field, metric: 0 }
          })
      ))
      aggsLabelsMetrics.value = results
      divisorMetric.value = undefined
      if (divisor.value.type === 'column') {
        try {
          divisorMetric.value = (await ofetch<MetricAggResponse>(`${datasetUrl.value}/metric_agg`, {
            params: { ...baseParams.value, field: divisor.value.field, metric: divisor.value.metric, finalizedAt: finalizedAt.value }
          })).metric
        } catch (e) {
          sendUiNotif({ type: 'error', msg: getErrorMsg(e as Error), error: e })
        }
      }
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
  const rawData = computed<{ labels: any, datasets: any[], rawLabels?: (string | null)[] | null } | null>(() => {
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
        divider: divisor.value,
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
        divider: divisor.value,
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
        dividerMetric: divisorMetric.value,
        metrics: aggsLabelsMetrics.value
      })
    }
    return null
  })

  // Inter-app selection: a click emits a lone key, a received selection is
  // highlighted (keys targeting the x-axis field do not restrict the
  // requests, see `conceptFilters` above).
  const selection = useChartSelection(() => rawData.value?.rawLabels)
  const lineBased = ['line', 'multi-line', 'combo', 'radar'].includes(chart.value?.type as string)
  const data = computed(() => (rawData.value
    ? applySelectionHighlight(rawData.value, selection.selectedValues(), lineBased)
    : null))

  return {
    data,
    selection
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
    // requested aggregate (sum/avg/min/max): API default = sum, to be sent explicitly
    out.metric = reactiveSearchParams.metric || c.metric || c.valueCalc?.metric
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

/** Merges several `field:metric` lists, deduplicating entries. */
function mergeExtraMetrics (...lists: Array<string | undefined>): string | undefined {
  const entries = lists.filter(Boolean).flatMap((l) => (l as string).split(',')).filter(Boolean)
  return entries.length ? [...new Set(entries)].join(',') : undefined
}
