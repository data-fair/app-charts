import { getColors, getOrderedLabels, splitString, createValueLabeler, valueLabelsMap, getFieldLabel } from '../../assets/utils'
import type { AggItem } from '@/composables/useChartData'

export interface AggsBasedLabelsContext {
  config: any
  chart: any
  fields: Record<string, any>
  finalizedAt: string | undefined
  baseParams: Record<string, string>
  metric: string | undefined
  getValue: (value: number | null | undefined, source?: unknown) => number | undefined
  stacked: string | undefined
  // API responses
  aggs: AggItem[]
}

export default function transformAggsBasedLabels (ctx: AggsBasedLabelsContext) {
  const { chart, fields, getValue, aggs, config, stacked } = ctx

  const fill = chart.area || (chart.type === 'multi-line' && stacked === 'true')

  const valueLabel = createValueLabeler(config)
  const customLabels = valueLabelsMap(config.valueLabels)

  const labels = chart.config.labelsValues
    .map((l: string) => getFieldLabel(l, fields, customLabels, chart.config.removeFromLabels))

  let series = aggs.slice(0, chart.config.size)
  series.forEach((s) => {
    (s as any).label = valueLabel(s.value, fields[chart.config.valuesLabel])
  })

  const seriesValues = series.map((s) => s.value + '')
  const orderedValues = getOrderedLabels(seriesValues, chart.config.colorOrder)
  series = orderedValues.map((v) => series.find((s) => (s.value + '') === v)!)

  const colors = getColors(series.map((s) => s.value as string), chart.config.colorOrder)
  const datasets = series.map((serie) => ({
    label: (serie as any).label as string,
    borderColor: colors[serie.value as string],
    backgroundColor: colors[serie.value as string],
    pointStyle: chart.hidePoints ? false : 'circle',
    fill,
    data: chart.config.labelsValues.map((l: string, li: number) =>
      // le diviseur est lu sur la série (agrégat du valuesLabel) : clé <champ>_<métrique>
      getValue(!li ? serie.metric : (serie as any)[l + '_' + (ctx.metric || chart.config.metric)], serie)
    )
  }))

  if (chart.percentage) {
    for (const i in datasets[0].data as number[]) {
      const sum = datasets.reduce((acc: number, d) => acc + ((d.data as number[])[i] || 0), 0)
      if (sum) datasets.forEach((d) => { (d.data as number[])[i] *= 100 / sum })
    }
  }

  return {
    labels: labels.map((l: string) => splitString(config.labelsMaxWidth ?? 20, l + '')),
    datasets
  }
}
