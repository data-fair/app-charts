import { ofetch } from 'ofetch'
import { computed } from 'vue'
import { useDebounce } from '@vueuse/core'
import reactiveSearchParams from '@data-fair/lib/vue/reactive-search-params-global.js'
import { useConceptFilters } from '@data-fair/lib/vue/concept-filters.js'
import { filters2qs } from '@data-fair/lib/filters.js'
import { getSortStr, getColors, splitString } from '@/assets/utils'
import useAppInfo from '@/composables/useAppInfo'
import { orderBy } from 'natural-orderby'

const { config, dataset, chart, datasetUrl, finalizedAt } = useAppInfo()
const conceptFilters = useConceptFilters(reactiveSearchParams, dataset?.id)

if (chart.stacked) reactiveSearchParams.stacked = reactiveSearchParams.stacked || 'true'
else delete reactiveSearchParams.stacked

function getParams (ignoreField) {
  return useDebounce(computed(() => {
    // if (!ignoreField && reactiveSearchParams._id) return { qs: `_id:"${escape(reactiveSearchParams._id)}"` }
    const params = { ...conceptFilters }
    if (ignoreField) delete params[`_d_${config.datasets?.[0]?.id}_${ignoreField}_in`]
    const qs = config.staticFilters?.length ? filters2qs(config.staticFilters).split(' AND ') : []
    if (qs.length) params.qs = qs.join(' AND ')
    return params
  }), 500)
}

const baseParams = getParams()
const getValue = (value) => value != null ? value / config.divider : undefined

let categories
export const getData = (theme) => ({
  rowsBased: async () => {
    const fill = chart.area || (chart.type === 'multi-line' && reactiveSearchParams.stacked === 'true')
    const select = [chart.config.labelsField.key].concat(chart.config.valuesField || chart.config.valuesFields.map(v => v.key))
    const params = {
      ...baseParams.value,
      size: chart.config.size,
      sort: getSortStr(chart.config),
      finalizedAt
    }
    if (chart.config.categoriesField) {
      select.push(chart.config.categoriesField)
      categories = categories || await ofetch(`${datasetUrl}/values/${chart.config.categoriesField}`)
    }
    params.select = select.join(',')
    const { results } = await ofetch(`${datasetUrl}/lines`, { params })
    const labels = results.map(r => r[chart.config.labelsField.key])
    let datasets
    if (chart.config.color) {
      const color = chart.config.color.type === 'custom' ? chart.config.color.hexValue : theme.current.value.colors[chart.config.color.strValue]
      datasets = [{
        borderColor: color,
        backgroundColor: color,
        data: results.map(r => getValue(r[chart.config.valuesField])),
        fill
      }]
    } else {
      const colors = getColors(categories || chart.config.valuesFields.map(v => v.key) || labels)
      if (chart.config.valuesField) {
        if (categories) {
          datasets = categories.map(category => ({
            label: category,
            borderColor: colors[category],
            backgroundColor: colors[category],
            fill,
            data: results.map(r => (r[chart.config.categoriesField] === category && getValue(r[chart.config.valuesField])) || undefined)
          }))
        } else {
          datasets = [{
            labels,
            borderColor: chart.type === 'pie' ? 'white' : labels.map(l => colors[l]),
            backgroundColor: labels.map(l => colors[l]),
            data: results.map(r => getValue(r[chart.config.valuesField]))
          }]
        }
      } else {
        datasets = chart.config.valuesFields.map(field => ({
          label: field.title || field.key,
          borderColor: colors[field.key],
          backgroundColor: colors[field.key],
          fill,
          data: results.map(r => getValue(r[field.key]))
        }))
        if (chart.percentage) {
          for (const i in datasets[0].data) {
            const sum = datasets.reduce((acc, d) => acc + (d.data[i] || 0), 0)
            if (sum) datasets.forEach(d => { d.data[i] *= 100 / sum })
          }
        }
      }
    }
    if (chart.type === 'paired-histogram') {
      datasets[0].data = datasets[0].data.map(d => -d)
    }
    return {
      labels: labels.map(l => splitString(config.labelsMaxWidth, l + '')),
      datasets
    }
  },
  aggsBased: async () => {
    const fill = chart.area || (chart.type === 'multi-line' && reactiveSearchParams.stacked === 'true')
    const params = {
      ...baseParams.value,
      size: 0,
      field: chart.config.groupBy.field.key,
      interval: chart.config.groupBy.interval || 'value',
      agg_size: chart.config.size,
      sort: getSortStr(chart.config),
      finalizedAt
    }
    if (chart.config.valueCalc?.type === 'metric' || chart.config.valuesCalc) {
      params.metric = reactiveSearchParams.metric || chart.config.metric || chart.config.valueCalc.metric
      params.metric_field = chart.config.valuesCalc?.[0]?.key || chart.config.valueCalc.field.key
      if (chart.config.valuesCalc?.length > 1) {
        params.extra_metrics = chart.config.valuesCalc.slice(1).map(v => v.key + ':' + chart.config.metric).join(',')
      }
    }
    if (chart.config.groupsField) {
      params.field = params.field + ';' + chart.config.groupsField.key
      params.agg_size = params.agg_size + ';12'
      params.sort = params.sort + ';-' + chart.config.valueCalc.type
    }
    const { aggs } = await ofetch(`${datasetUrl}/values_agg`, { params })
    const labels = aggs.slice(0, chart.config.size).map(a => chart.config.groupBy.field['x-labels'] ? chart.config.groupBy.field['x-labels'][a.value] : a.value)
    let datasets
    if (chart.config.color) {
      const color = chart.config.color.type === 'custom' ? chart.config.color.hexValue : theme.current.value.colors[chart.config.color.strValue]
      datasets = [{
        borderColor: color,
        backgroundColor: color,
        data: aggs.slice(0, chart.config.size).map(a => getValue(chart.config.valueCalc && chart.config.valueCalc.type === 'metric' ? a.metric : a.total)),
        fill
      }]
    } else {
      if (chart.config.groupsField) {
        const series = chart.config.colors.type === 'manual' ? chart.config.colors.styles.map(s => s.value) : orderBy([].concat(...aggs.map(a => a.aggs.map(ag => ag.value + ''))).filter((s, i, self) => self.indexOf(s) === i))
        const colors = getColors(series)
        datasets = series.map(label => ({
          label: chart.config.groupsField['x-labels'] ? chart.config.groupsField['x-labels'][label] : label,
          borderColor: colors[label],
          backgroundColor: colors[label],
          fill,
          data: aggs.slice(0, chart.config.size).map(a => {
            const val = a.aggs.find(ag => (ag.value + '') === label)
            return val ? getValue(chart.config.valueCalc && chart.config.valueCalc.type === 'metric' ? val.metric : val.total) : undefined
          })
        }))
        if (chart.percentage) {
          for (const i in datasets[0].data) {
            const sum = datasets.reduce((acc, d) => acc + (d.data[i] || 0), 0)
            if (sum) datasets.forEach(d => { d.data[i] *= 100 / sum })
          }
        }
      } else {
        if (chart?.config.type === 'aggsBasedCategories') {
          const colors = getColors(chart.config.valuesCalc.map(v => v.key))
          datasets = chart.config.valuesCalc.map((field, i) => ({
            label: field.title || field.key,
            borderColor: colors[field.key],
            backgroundColor: colors[field.key],
            fill,
            data: aggs.map(a => getValue(i === 0 ? a.metric : a[field.key + '_' + chart.config.metric]))
          }))
        } else {
          const colors = getColors(labels)
          datasets = [{
            labels,
            borderColor: chart.type === 'pie' ? 'white' : labels.map(l => colors[l]),
            backgroundColor: labels.map(l => colors[l]),
            data: aggs.slice(0, chart.config.size).map(a => getValue(chart.config.valueCalc && chart.config.valueCalc.type === 'metric' ? a.metric : a.total))
          }]
        }
      }
    }
    if (chart.type === 'paired-histogram') {
      datasets[0].data = datasets[0].data.map(d => -d)
    }
    return {
      labels: labels.map(l => splitString(config.labelsMaxWidth, l + '')),
      datasets
    }
  }
})
