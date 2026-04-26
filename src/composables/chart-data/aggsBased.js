/**
 * @param {object} ctx
 * @param {import('vue').Ref} ctx.config
 * @param {import('vue').Ref} ctx.chart
 * @param {import('vue').Ref} ctx.fields
 * @param {import('vue').Ref} ctx.datasetUrl
 * @param {import('vue').Ref} ctx.finalizedAt
 * @param {import('vue').Ref} ctx.baseParams
 * @param {Function} ctx.getValue
 * @param {import('vue').Ref} ctx.displayError
 * @param {import('vue').Ref} ctx.errorMessage
 */

import { ofetch } from 'ofetch'
import { getSortStr, getColors, splitString } from '@/assets/utils'
import { orderBy } from 'natural-orderby'

export default async function fetchAggsBasedData (ctx, theme) {
  const { config, chart, fields, datasetUrl, finalizedAt, baseParams, getValue, displayError, errorMessage, stacked, metric } = ctx

  const fill = chart.value.area || (chart.value.type === 'multi-line' && stacked === 'true')
  const params = {
    ...baseParams.value,
    size: 0,
    field: chart.value.config.groupBy.field,
    interval: chart.value.config.groupBy.interval || 'value',
    agg_size: chart.value.type === 'pie' ? 1000 : chart.value.config.size,
    sort: getSortStr(chart.value.config),
    finalizedAt: finalizedAt.value
  }

  if (chart.value.config.missingLabel) params.missing = chart.value.config.missingLabel
  if (chart.value.config.valueCalc?.type === 'metric' || chart.value.config.valuesCalc) {
    params.metric = metric || chart.value.config.metric || chart.value.config.valueCalc.metric
    params.metric_field = chart.value.config.valuesCalc?.[0] || chart.value.config.valueCalc.field
    if (chart.value.config.valuesCalc?.length > 1) {
      params.extra_metrics = chart.value.config.valuesCalc.slice(1).map(v => v + ':' + chart.value.config.metric).join(',')
    }
  }

  if (chart.value.config.groupsField) {
    params.field = params.field + ';' + chart.value.config.groupsField
    params.agg_size = params.agg_size + ';12'
    params.sort = params.sort + ';-' + chart.value.config.valueCalc.type
  }

  const { aggs } = await ofetch(`${datasetUrl.value}/values_agg`, { params }).catch(e => {
    errorMessage.value = e.status + ' - ' + e.data
    displayError.value = true
    return { aggs: [] }
  })

  const rawLabels = aggs.slice(0, chart.value.config.size).map(a => a.value)
  const labels = rawLabels.map(a => fields.value[chart.value.config.groupBy.field]['x-labels']?.[a] || a)
  let datasets

  if (chart.value.config.color) {
    const color = chart.value.config.color.type === 'custom' ? chart.value.config.color.hexValue : theme.current.value.colors[chart.value.config.color.strValue]
    datasets = [{
      borderColor: color,
      backgroundColor: color,
      data: aggs.slice(0, chart.value.config.size).map(a => getValue(chart.value.config.valueCalc && chart.value.config.valueCalc.type === 'metric' ? a.metric : a.total)),
      pointStyle: chart.value.hidePoints ? false : 'circle',
      fill
    }]
  } else {
    if (chart.value.config.groupsField) {
      const series = chart.value.config.colors.type === 'manual'
        ? chart.value.config.colors.styles.map(s => s.value)
        : orderBy([...new Set([].concat(...aggs.map(a => a.aggs.map(ag => ag.value + ''))))])
      const colors = getColors(series, chart.value.config.colors)
      datasets = series.map(label => ({
        label: fields.value[chart.value.config.groupsField]['x-labels']?.[label] || label,
        borderColor: colors[label],
        backgroundColor: colors[label],
        pointStyle: chart.value.hidePoints ? false : 'circle',
        fill,
        data: aggs.slice(0, chart.value.config.size).map(a => {
          const val = a.aggs.find(ag => (ag.value + '') === label)
          return val ? getValue(chart.value.config.valueCalc && chart.value.config.valueCalc.type === 'metric' ? val.metric : val.total) : undefined
        })
      }))
      if (chart.value.percentage) {
        for (const i in datasets[0].data) {
          const sum = datasets.reduce((acc, d) => acc + (d.data[i] || 0), 0)
          if (sum) datasets.forEach(d => { d.data[i] *= 100 / sum })
        }
      }
    } else {
      if (chart.value.config.type === 'aggsBasedCategories') {
        const colors = getColors(chart.value.config.valuesCalc, chart.value.config.colors)
        datasets = chart.value.config.valuesCalc.map((field, i) => ({
          label: chart.value.config.removeFromLabels
            ? (fields.value[field].label || fields.value[field].title || fields.value[field]['x-originalName'] || field).replace(chart.value.config.removeFromLabels, '')
            : (fields.value[field].label || fields.value[field].title || fields.value[field]['x-originalName'] || field),
          borderColor: colors[field],
          backgroundColor: colors[field],
          pointStyle: chart.value.hidePoints ? false : 'circle',
          fill,
          data: aggs.map(a => getValue(i === 0 ? a.metric : a[field + '_' + chart.value.config.metric]))
        }))
      } else {
        if (chart.value.type === 'pie' && aggs.length > chart.value.config.size) {
          labels.push('Autre')
          rawLabels.push('Autre')
        }
        const colors = getColors(rawLabels, chart.value.config.colors)
        datasets = [{
          labels,
          borderColor: chart.value.type === 'pie' ? 'white' : rawLabels.map(l => colors[l]),
          backgroundColor: rawLabels.map(l => colors[l] || chart.value.config.colors?.defaultColor || '#828282'),
          data: aggs.slice(0, chart.value.config.size).map(a => getValue(chart.value.config.valueCalc && chart.value.config.valueCalc.type === 'metric' ? a.metric : a.total))
        }]
        if (chart.value.type === 'pie' && aggs.length > chart.value.config.size) {
          const otherSum = aggs.slice(chart.value.config.size).reduce((acc, a) => acc + (chart.value.config.valueCalc && chart.value.config.valueCalc.type === 'metric' ? a.metric : a.total), 0)
          datasets[0].data.push(getValue(otherSum))
          datasets[0].backgroundColor.push(chart.value.config.colors?.defaultColor || '#828282')
        }
        if (['percentages', 'both'].includes(chart.value.display)) {
          const sum = datasets[0].data.reduce((acc, d) => acc + (d || 0), 0)
          datasets[0].percentages = datasets[0].data.map(d => d * 100 / sum)
        }
      }
    }
  }

  if (chart.value.type === 'paired-histogram') {
    datasets[0].data = datasets[0].data.map(d => -d)
  }

  return {
    labels: labels.map(l => splitString(config.value.labelsMaxWidth, l + '')),
    datasets
  }
}
