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
import { getColors, splitString } from '@/assets/utils'

export default async function fetchAggsBasedLabelsData (ctx, theme) {
  const { config, chart, fields, datasetUrl, finalizedAt, baseParams, getValue, displayError, errorMessage, stacked, metric } = ctx

  const fill = chart.value.area || (chart.value.type === 'multi-line' && stacked === 'true')
  const params = {
    ...baseParams.value,
    size: 0,
    field: chart.value.config.valuesLabel,
    sort: chart.value.config.valuesLabel,
    agg_size: chart.value.config.size,
    metric: metric || chart.value.config.metric,
    metric_field: chart.value.config.labelsValues?.[0],
    finalizedAt: finalizedAt.value
  }

  if (chart.value.config.missingLabel) params.missing = chart.value.config.missingLabel
  if (chart.value.config.labelsValues?.length > 1) {
    params.extra_metrics = chart.value.config.labelsValues.slice(1).map(v => v + ':' + chart.value.config.metric).join(',')
  }

  const { aggs } = await ofetch(`${datasetUrl.value}/values_agg`, { params }).catch(e => {
    errorMessage.value = e.status + ' - ' + e.data
    displayError.value = true
    return { aggs: [] }
  })

  const labels = chart.value.config.labelsValues
    .map(l => fields.value?.[l].label || fields.value?.[l].title || fields.value?.[l]['x-originalName'] || l)
    .map(l => chart.value.config.removeFromLabels ? l.replace(chart.value.config.removeFromLabels, '') : l)

  const series = aggs.slice(0, chart.value.config.size)
  series.forEach(s => {
    s.label = fields.value?.[chart.value.config.valuesLabel]?.['x-labels']?.[s.value] || s.value
  })

  const colors = getColors(series.map(s => s.value), chart.value.config.colors)
  const datasets = series.map((serie, i) => ({
    label: serie.label,
    borderColor: colors[serie.value],
    backgroundColor: colors[serie.value],
    pointStyle: chart.value.hidePoints ? false : 'circle',
    fill,
    data: chart.value.config.labelsValues.map((l, li) => getValue(!li ? serie.metric : serie[l + '_' + params.metric]))
  }))

  return {
    labels: labels.map(l => splitString(config.value.labelsMaxWidth, l + '')),
    datasets
  }
}
