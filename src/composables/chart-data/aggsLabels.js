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

export default async function fetchAggsLabelsData (ctx) {
  const { config, chart, fields, datasetUrl, finalizedAt, baseParams, getValue, displayError, errorMessage } = ctx

  const params = {
    ...baseParams.value,
    metric: 'sum',
    finalizedAt: finalizedAt.value
  }

  const metrics = await Promise.all(chart.value.config.valuesFields?.map(v => {
    params.field = v.key
    return ofetch(`${datasetUrl.value}/metric_agg`, { params }).catch(e => {
      errorMessage.value = e.status + ' - ' + e.data
      displayError.value = true
    })
  }))

  const labels = chart.value.config.valuesFields
    .map(f => fields.value[f.key].label || fields.value[f.key].title || fields.value[f.key]['x-originalName'] || f.key)
    .map(l => chart.value.config.removeFromLabels ? l.replace(chart.value.config.removeFromLabels, '') : l)

  const colors = getColors(chart.value.config.valuesFields.map(f => f.key), chart.value.config.colors)
  const datasets = [{
    labels,
    borderColor: 'white',
    backgroundColor: chart.value.config.valuesFields.map(f => f.key).map(l => colors[l] || chart.value.config.colors?.defaultColor || '#828282'),
    data: metrics.map(a => getValue(a.metric))
  }]

  if (['percentages', 'both'].includes(chart.value.display)) {
    const sum = datasets[0].data.reduce((acc, d) => acc + (d || 0), 0)
    datasets[0].percentages = datasets[0].data.map(d => d * 100 / sum)
  }

  return {
    labels: labels.map(l => splitString(config.value.labelsMaxWidth, l + '')),
    datasets
  }
}
