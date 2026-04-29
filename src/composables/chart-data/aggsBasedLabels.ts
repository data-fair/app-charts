import { ofetch } from 'ofetch'
import { getColors, getOrderedLabels, splitString } from '@/assets/utils'
import type { ChartDataCtx, ValuesAggResponse } from '@/composables/useChartData'
import type { ThemeInstance } from 'vuetify'

export default async function fetchAggsBasedLabelsData (ctx: ChartDataCtx, theme: ThemeInstance) {
  const { config, chart, fields, datasetUrl, finalizedAt, baseParams, getValue, displayError, errorMessage, stacked, metric } = ctx

  const fill = chart.value!.area || (chart.value!.type === 'multi-line' && stacked === 'true')
  const params: Record<string, string | number | undefined> = {
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

  const { aggs } = await ofetch<ValuesAggResponse>(`${datasetUrl.value}/values_agg`, { params }).catch((e) => {
    errorMessage.value = e.status + ' - ' + e.data
    displayError.value = true
    return { aggs: [] }
  })

  const labels = chart.value!.config.labelsValues
    .map((l: string) => fields.value?.[l].label || fields.value?.[l].title || fields.value?.[l]['x-originalName'] || l)
    .map((l: string) => chart.value!.config.removeFromLabels ? l.replace(chart.value!.config.removeFromLabels, '') : l)

  let series = aggs.slice(0, chart.value!.config.size)
  series.forEach((s) => {
    (s as any).label = fields.value?.[chart.value!.config.valuesLabel]?.['x-labels']?.[s.value as string] || s.value
  })

  const seriesValues = series.map((s) => s.value + '')
  const orderedValues = getOrderedLabels(seriesValues, chart.value!.config.colorOrder)
  series = orderedValues.map((v) => series.find((s) => (s.value + '') === v)!)

  const colors = getColors(series.map((s) => s.value as string), chart.value!.config.colorOrder)
  const datasets = series.map((serie) => ({
    label: (serie as any).label as string,
    borderColor: colors[serie.value as string],
    backgroundColor: colors[serie.value as string],
    pointStyle: chart.value!.hidePoints ? false : 'circle',
    fill,
    data: chart.value!.config.labelsValues.map((l: string, li: number) => getValue(!li ? serie.metric : (serie as any)[l + '_' + params.metric]))
  }))

  if (chart.value!.percentage) {
    for (const i in datasets[0].data as number[]) {
      const sum = datasets.reduce((acc: number, d) => acc + ((d.data as number[])[i] || 0), 0)
      if (sum) datasets.forEach((d) => { (d.data as number[])[i] *= 100 / sum })
    }
  }

  return {
    labels: labels.map((l: string) => splitString(config.value.labelsMaxWidth ?? 20, l + '')),
    datasets
  }
}
