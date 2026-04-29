import { ofetch } from 'ofetch'
import { getColors, splitString } from '@/assets/utils'
import type { ChartDataCtx } from '@/composables/useChartData'

export default async function fetchAggsLabelsData (ctx: ChartDataCtx) {
  const { config, chart, fields, datasetUrl, finalizedAt, baseParams, getValue, displayError, errorMessage } = ctx

  const params: any = {
    ...baseParams.value,
    metric: 'sum',
    finalizedAt: finalizedAt.value
  }

  const metrics = await Promise.all(chart.value!.config.valuesFields?.map((v: string) => {
    params.field = v
    return ofetch(`${datasetUrl.value}/metric_agg`, { params }).catch((e: any) => {
      errorMessage.value = e.status + ' - ' + e.data
      displayError.value = true
      return { metric: 0 }
    })
  }) || [])

  const labels = chart.value!.config.valuesFields
    .map((f: string) => fields.value[f].label || fields.value[f].title || fields.value[f]['x-originalName'] || f)
    .map((l: string) => chart.value!.config.removeFromLabels ? l.replace(chart.value!.config.removeFromLabels, '') : l)

  const colors = getColors(chart.value!.config.valuesFields, chart.value!.config.colorOrder)
  const datasets: any[] = [{
    labels,
    borderColor: 'white',
    backgroundColor: chart.value!.config.valuesFields.map((l: string) => colors[l] || (chart.value!.config.colorOrder as any)?.defaultColor || '#828282'),
    data: metrics.map((a: any) => getValue(a.metric))
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
