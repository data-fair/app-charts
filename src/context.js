import { ofetch } from 'ofetch'
import { computed, ref } from 'vue'
import { useDebounce } from '@vueuse/core'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import { useConceptFilters } from '@data-fair/lib-vue/concept-filters.js'
import { filters2qs } from '@data-fair/lib-utils/filters'
import { getSortStr, getColors, splitString } from '@/assets/utils'
import useAppInfo from '@/composables/useAppInfo'
import { orderBy } from 'natural-orderby'

const { config, dataset, chart, datasetUrl, fields, finalizedAt } = useAppInfo()
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

export const displayError = ref(false)
export const errorMessage = ref('')

let categories
export const getData = (theme) => ({
  rowsBased: async () => {
    const fill = chart.area || (chart.type === 'multi-line' && reactiveSearchParams.stacked === 'true')
    const select = [chart.config.labelsField.key].concat(chart.config.valuesField || chart.config.valuesFields.map(v => v.key))
    const params = {
      ...baseParams.value,
      size: chart.type === 'pie' ? 10000 : chart.config.size,
      sort: getSortStr(chart.config),
      finalizedAt
    }
    if (chart.config.categoriesField) {
      select.push(chart.config.categoriesField)
      categories = categories || await ofetch(`${datasetUrl}/values/${chart.config.categoriesField}`).catch(e => {
        errorMessage.value = e.status + ' - ' + e.data
        displayError.value = true
      })
    }
    params.select = select.join(',')
    const { results } = await ofetch(`${datasetUrl}/lines`, { params }).catch(e => {
      errorMessage.value = e.status + ' - ' + e.data
      displayError.value = true
    })
    const labels = results.map(r => fields[chart.config.labelsField.key]['x-labels']?.[r[chart.config.labelsField.key]] || r[chart.config.labelsField.key]).slice(0, chart.config.size)
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
      const rawLabels = results.slice(0, chart.config.size).map(r => r[chart.config.labelsField.key])
      if (chart.type === 'pie' && results.length > chart.config.size) {
        labels.push('Autre')
        rawLabels.push('Autre')
      }
      const colors = getColors(categories || (chart.config.valuesField && rawLabels) || chart.config.valuesFields?.map(v => v.key))
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
            borderColor: chart.type === 'pie' ? 'white' : rawLabels.map(l => colors[l]),
            backgroundColor: rawLabels.map(l => colors[l] || chart.config.colors?.defaultColor || '#828282'),
            data: results.slice(0, chart.config.size).map(r => getValue(r[chart.config.valuesField]))
          }]
          if (chart.type === 'pie' && results.length > chart.config.size) {
            const otherSum = results.slice(chart.config.size).reduce((acc, r) => acc + r[chart.config.valuesField], 0)
            datasets[0].data.push(getValue(otherSum))
            datasets[0].backgroundColor.push(chart.config.colors?.defaultColor || '#828282')
          }
          if (['percentages', 'both'].includes(chart.display)) {
            const sum = datasets[0].data.reduce((acc, d) => acc + (d || 0), 0)
            datasets[0].percentages = datasets[0].data.map(d => d * 100 / sum)
          }
        }
      } else {
        datasets = chart.config.valuesFields.map(field => ({
          label: chart.config.removeFromLabels ? (fields[field.key].label || fields[field.key].title || fields[field.key]['x-originalName'] || field.key).replace(chart.config.removeFromLabels, '') : (fields[field.key].label || fields[field.key].title || fields[field.key]['x-originalName'] || field.key),
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
      agg_size: chart.type === 'pie' ? 1000 : chart.config.size,
      sort: getSortStr(chart.config),
      finalizedAt
    }
    if (chart.config.missingLabel) params.missing = chart.config.missingLabel
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
    const { aggs } = await ofetch(`${datasetUrl}/values_agg`, { params }).catch(e => {
      errorMessage.value = e.status + ' - ' + e.data
      displayError.value = true
    })
    const rawLabels = aggs.slice(0, chart.config.size).map(a => a.value)
    const labels = rawLabels.map(a => fields[chart.config.groupBy.field.key]['x-labels']?.[a] || a)
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
          label: fields[chart.config.groupsField.key]['x-labels']?.[label] || label,
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
        if (chart.config.type === 'aggsBasedCategories') {
          const colors = getColors(chart.config.valuesCalc.map(v => v.key))
          datasets = chart.config.valuesCalc.map((field, i) => ({
            label: chart.config.removeFromLabels ? (fields[field.key].label || fields[field.key].title || fields[field.key]['x-originalName'] || field.key).replace(chart.config.removeFromLabels, '') : (fields[field.key].label || fields[field.key].title || fields[field.key]['x-originalName'] || field.key),
            borderColor: colors[field.key],
            backgroundColor: colors[field.key],
            fill,
            data: aggs.map(a => getValue(i === 0 ? a.metric : a[field.key + '_' + chart.config.metric]))
          }))
        } else {
          if (chart.type === 'pie' && aggs.length > chart.config.size) {
            labels.push('Autre')
            rawLabels.push('Autre')
          }
          const colors = getColors(rawLabels)
          datasets = [{
            labels,
            borderColor: chart.type === 'pie' ? 'white' : rawLabels.map(l => colors[l]),
            backgroundColor: rawLabels.map(l => colors[l] || chart.config.colors?.defaultColor || '#828282'),
            data: aggs.slice(0, chart.config.size).map(a => getValue(chart.config.valueCalc && chart.config.valueCalc.type === 'metric' ? a.metric : a.total))
          }]
          if (chart.type === 'pie' && aggs.length > chart.config.size) {
            const otherSum = aggs.slice(chart.config.size).reduce((acc, a) => acc + (chart.config.valueCalc && chart.config.valueCalc.type === 'metric' ? a.metric : a.total), 0)
            datasets[0].data.push(getValue(otherSum))
            datasets[0].backgroundColor.push(chart.config.colors?.defaultColor || '#828282')
          }
          if (['percentages', 'both'].includes(chart.display)) {
            const sum = datasets[0].data.reduce((acc, d) => acc + (d || 0), 0)
            datasets[0].percentages = datasets[0].data.map(d => d * 100 / sum)
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
  aggsBasedLabels: async () => {
    const fill = chart.area || (chart.type === 'multi-line' && reactiveSearchParams.stacked === 'true')
    const params = {
      ...baseParams.value,
      size: 0,
      field: chart.config.valuesLabel,
      sort: chart.config.valuesLabel,
      agg_size: chart.config.size,
      metric: reactiveSearchParams.metric || chart.config.metric,
      metric_field: chart.config.labelsValues?.[0],
      finalizedAt
    }
    if (chart.config.missingLabel) params.missing = chart.config.missingLabel
    if (chart.config.labelsValues?.length > 1) {
      params.extra_metrics = chart.config.labelsValues.slice(1).map(v => v + ':' + chart.config.metric).join(',')
    }
    const { aggs } = await ofetch(`${datasetUrl}/values_agg`, { params }).catch(e => {
      errorMessage.value = e.status + ' - ' + e.data
      displayError.value = true
    })
    const labels = chart.config.labelsValues.map(l => fields?.[l].label || fields?.[l].title || fields?.[l]['x-originalName'] || l).map(l => chart.config.removeFromLabels ? l.replace(chart.config.removeFromLabels, '') : l)
    const series = aggs.slice(0, chart.config.size)
    series.forEach(s => {
      s.label = fields?.[chart.config.valuesLabel]['x-labels']?.[s.value] || s.value
    })
    const colors = getColors(series.map(s => s.value))
    const datasets = series.map((serie, i) => ({
      label: serie.label,
      borderColor: colors[serie.value],
      backgroundColor: colors[serie.value],
      fill,
      data: chart.config.labelsValues.map((l, i) => getValue(!i ? serie.metric : serie[l + '_' + params.metric]))
    }))

    return {
      labels: labels.map(l => splitString(config.labelsMaxWidth, l + '')),
      datasets
    }
  },
  aggsLabels: async () => {
    const params = {
      ...baseParams.value,
      metric: 'sum',
      finalizedAt
    }
    const metrics = await Promise.all(chart.config.valuesFields?.map(v => {
      params.field = v.key
      return ofetch(`${datasetUrl}/metric_agg`, { params }).catch(e => {
        errorMessage.value = e.status + ' - ' + e.data
        displayError.value = true
      })
    }))
    const labels = chart.config.valuesFields.map(f => fields[f.key].label || fields[f.key].title || fields[f.key]['x-originalName'] || f.key).map(l => chart.config.removeFromLabels ? l.replace(chart.config.removeFromLabels, '') : l)
    const colors = getColors(chart.config.valuesFields.map(f => f.key))
    const datasets = [{
      labels,
      borderColor: 'white',
      backgroundColor: chart.config.valuesFields.map(f => f.key).map(l => colors[l] || chart.config.colors?.defaultColor || '#828282'),
      data: metrics.map(a => getValue(a.metric))
    }]
    if (['percentages', 'both'].includes(chart.display)) {
      const sum = datasets[0].data.reduce((acc, d) => acc + (d || 0), 0)
      datasets[0].percentages = datasets[0].data.map(d => d * 100 / sum)
    }

    return {
      labels: labels.map(l => splitString(config.labelsMaxWidth, l + '')),
      datasets
    }
  }
})
