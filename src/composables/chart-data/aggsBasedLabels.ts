import { ofetch } from 'ofetch'
import { getColors, getOrderedLabels, splitString } from '@/assets/utils'
import type { ChartDataCtx } from '@/composables/useChartData'

export default async function fetchAggsBasedLabelsData (ctx: ChartDataCtx, theme: any) {
  const { config, chart, fields, datasetUrl, finalizedAt, baseParams, getValue, displayError, errorMessage, stacked, metric } = ctx

  const fill = chart.value!.area || (chart.value!.type === 'multi-line' && stacked === 'true')
  const params: any = {
    ...baseParams.value,
    size: 0,
    field: chart.value!.config.valuesLabel,
    sort: chart.value!.config.valuesLabel,
    agg_size: chart.value!.config.size,
    metric: metric || chart.value!.config.metric,
    metric_field: chart.value!.config.labelsValues?.[0],
    finalizedAt: finalizedAt.value
  }

  if (chart.value!.config.missingLabel) params.missing = chart.value!.config.missingLabel
  if (chart.value!.config.labelsValues?.length > 1) {
    params.extra_metrics = chart.value!.config.labelsValues.slice(1).map((v: string) => v + ':' + chart.value!.config.metric).join(',')
  }

  const { aggs } = await ofetch(`${datasetUrl.value}/values_agg`, { params }).catch((e: any) => {
    errorMessage.value = e.status + ' - ' + e.data
    displayError.value = true
    return { aggs: [] }
  })

  const labels = chart.value!.config.labelsValues
    .map((l: string) => fields.value?.[l].label || fields.value?.[l].title || fields.value?.[l]['x-originalName'] || l)
    .map((l: string) => chart.value!.config.removeFromLabels ? l.replace(chart.value!.config.removeFromLabels, '') : l)

  let series = aggs.slice(0, chart.value!.config.size)
  series.forEach((s: any) => {
    s.label = fields.value?.[chart.value!.config.valuesLabel]?.['x-labels']?.[s.value] || s.value
  })

  const seriesValues = series.map((s: any) => s.value + '')
  const orderedValues = getOrderedLabels(seriesValues, chart.value!.config.colorOrder)
  series = orderedValues.map((v: string) => series.find((s: any) => (s.value + '') === v)!)

  const colors = getColors(series.map((s: any) => s.value), chart.value!.config.colorOrder)
  const datasets = series.map((serie: any, _i: number) => ({
    label: serie.label,
    borderColor: colors[serie.value],
    backgroundColor: colors[serie.value],
    pointStyle: chart.value!.hidePoints ? false : 'circle',
    fill,
    data: chart.value!.config.labelsValues.map((l: string, li: number) => getValue(!li ? serie.metric : serie[l + '_' + params.metric]))
  }))

  if (chart.value!.percentage) {
    for (const i in datasets[0].data) {
      const sum = datasets.reduce((acc: number, d: any) => acc + (d.data[i] || 0), 0)
      if (sum) datasets.forEach((d: any) => { d.data[i] *= 100 / sum })
    }
  }

  return {
    labels: labels.map((l: string) => splitString(config.value.labelsMaxWidth ?? 20, l + '')),
    datasets
  }
}
