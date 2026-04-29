import { ofetch } from 'ofetch'
import { getColors, getOrderedLabels, splitString } from '@/assets/utils'
import type { ChartDataCtx, MetricAggResponse } from '@/composables/useChartData'

export default async function fetchAggsLabelsData (ctx: ChartDataCtx) {
  const { config, chart, fields, datasetUrl, finalizedAt, baseParams, getValue, displayError, errorMessage } = ctx

  const params: Record<string, string | number | undefined> = {
    ...baseParams.value,
    metric: 'sum',
    finalizedAt: finalizedAt.value
  }

  const metrics = await Promise.all(chart.value!.config.valuesFields?.map((v: string) => {
    params.field = v
    return ofetch<MetricAggResponse>(`${datasetUrl.value}/metric_agg`, { params }).catch((e) => {
      errorMessage.value = e.status + ' - ' + e.data
      displayError.value = true
      return { metric: 0 }
    })
  }) || [])

  const orderedValuesFields = getOrderedLabels(chart.value!.config.valuesFields || [], chart.value!.config.colorOrder)
  const metricsMap = new Map<string, MetricAggResponse>(chart.value!.config.valuesFields!.map((f: string, i: number) => [f, metrics[i]]))

  const labels: string[] = orderedValuesFields
    .map((f: string) => (fields.value[f].label || fields.value[f].title || fields.value[f]['x-originalName'] || f) as string)
    .map((l: string) => chart.value!.config.removeFromLabels ? l.replace(chart.value!.config.removeFromLabels, '') : l)

  const colors = getColors(orderedValuesFields, chart.value!.config.colorOrder)
  const datasets: any[] = [{
    labels,
    borderColor: 'white',
    backgroundColor: orderedValuesFields.map((l: string) => colors[l] || chart.value!.config.colorOrder?.defaultColor || '#828282'),
    data: orderedValuesFields.map((f: string) => getValue(metricsMap.get(f)!.metric))
  }]

  if (['percentages', 'both'].includes(chart.value!.display as string)) {
    const sum = datasets[0].data.reduce((acc: number, d: number | undefined) => acc + (d || 0), 0)
    datasets[0].percentages = datasets[0].data.map((d: number | undefined) => d! * 100 / sum)
  }

  return {
    labels: labels.map((l: string) => splitString(config.value.labelsMaxWidth ?? 20, l + '')),
    datasets
  }
}
