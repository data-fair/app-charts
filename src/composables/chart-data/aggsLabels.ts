import { getColors, getOrderedLabels, splitString } from '@/assets/utils'

export interface AggsLabelsContext {
  config: any
  chart: any
  fields: Record<string, any>
  finalizedAt: string | undefined
  baseParams: Record<string, string>
  metric: string | undefined
  getValue: (value: number | null | undefined) => number | undefined
  // API responses
  metrics: Array<{ field: string; metric: number }>
}

export default function transformAggsLabels (ctx: AggsLabelsContext) {
  const { chart, fields, getValue, metric, metrics, config } = ctx

  const orderedValuesFields = getOrderedLabels(chart.config.valuesFields || [], chart.config.colorOrder)
  const metricsMap = new Map<string, { metric: number }>(metrics.map((m) => [m.field, m]))

  const labels: string[] = orderedValuesFields
    .map((f: string) => (fields[f].label || fields[f].title || fields[f]['x-originalName'] || f) as string)
    .map((l: string) => chart.config.removeFromLabels ? l.replace(chart.config.removeFromLabels, '') : l)

  const colors = getColors(orderedValuesFields, chart.config.colorOrder)
  const datasets: any[] = [{
    labels,
    borderColor: 'white',
    backgroundColor: orderedValuesFields.map((l: string) => colors[l] || chart.config.colorOrder?.defaultColor || '#828282'),
    data: orderedValuesFields.map((f: string) => getValue(metricsMap.get(f)?.metric))
  }]

  if (['percentages', 'both'].includes(chart.display as string)) {
    const sum = datasets[0].data.reduce((acc: number, d: number | undefined) => acc + (d || 0), 0)
    datasets[0].percentages = datasets[0].data.map((d: number | undefined) => d! * 100 / sum)
  }

  return {
    labels: labels.map((l: string) => splitString(config.labelsMaxWidth ?? 20, l + '')),
    datasets
  }
}
