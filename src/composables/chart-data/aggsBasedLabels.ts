import type { AggItem } from '@/composables/useChartData'
import { getColors, getOrderedLabels, splitString, createValueLabeler, valueLabelsMap, getFieldLabel, objectifColor, CARTESIAN_TYPES, LINE_DASH_PATTERNS } from '../../assets/utils'

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

  const valueLabel = createValueLabeler(config, chart.config.removeFromLabels)
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
  const datasets: any[] = series.map((serie) => ({
    label: (serie as any).label as string,
    borderColor: colors[serie.value as string],
    backgroundColor: colors[serie.value as string],
    pointStyle: chart.hidePoints ? false : 'circle',
    fill,
    data: chart.config.labelsValues.map((l: string, li: number) =>
      // column without any value (value_count = 0): sum returns 0, a gap is preferred
      (serie as any)[l + '_value_count'] === 0
        ? undefined
        // the divider is read on the series (valuesLabel aggregate): key <field>_<metric>
        : getValue(!li ? serie.metric : (serie as any)[l + '_' + (ctx.metric || chart.config.metric)], serie)
    )
  }))

  if (chart.percentage) {
    for (const i in datasets[0].data as number[]) {
      const sum = datasets.reduce((acc: number, d) => acc + ((d.data as number[])[i] || 0), 0)
      // a missing value stays missing (no NaN) when other series have values
      if (sum) datasets.forEach((d) => { if ((d.data as number[])[i] != null) (d.data as number[])[i] *= 100 / sum })
    }
  }

  // Targets from the data: one dashed line per target column and
  // per series. The target is constant along the time axis (average of the
  // series rows, see `extra_metrics` = `<field>:avg`) and follows the chart
  // multiplier, like the values. Added after the percentages so it is not
  // normalized, with its own stack group so it is never
  // summed with the series. Ignored for types without a cartesian axis (radar).
  const objectifFields: string[] = chart.config.objectifFields || []
  if (objectifFields.length && CARTESIAN_TYPES.includes(chart.type)) {
    series.forEach((serie, serieIndex) => {
      objectifFields.forEach((field, fieldIndex) => {
        const value = getValue((serie as any)[field + '_avg'], serie)
        if (value === undefined) return
        const color = objectifColor(fieldIndex)
        const label = getFieldLabel(field, fields, customLabels, chart.config.removeFromLabels)
        datasets.push({
          type: 'line',
          label: series.length > 1 ? label + ' – ' + (serie as any).label : label,
          borderColor: color,
          backgroundColor: color,
          borderDash: LINE_DASH_PATTERNS.dashed,
          pointStyle: false,
          fill: false,
          stack: 'objectif-' + fieldIndex + '-' + serieIndex,
          data: chart.config.labelsValues.map(() => value)
        })
      })
    })
  }

  return {
    labels: labels.map((l: string) => splitString(config.labelsMaxWidth ?? 20, l + '')),
    datasets,
    // the x-axis is a column, not a value: no entity to select
    rawLabels: null
  }
}
