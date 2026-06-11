import { getColors, getOrderedLabels, splitString, formatDateLabel, fillMissingDateAggs } from '@/assets/utils'
import type { AggItem } from '@/composables/useChartData'

export interface AggsBasedContext {
  config: any
  chart: any
  fields: Record<string, any>
  finalizedAt: string | undefined
  baseParams: Record<string, string>
  getValue: (value: number | null | undefined) => number | undefined
  stacked: string | undefined
  metric: string | undefined
  // current value of theme.current ref (InternalThemeDefinition)
  theme: { colors: Record<string, string> }
  // reactive search params mirror (already-reactive strings)
  sortBy: string | undefined
  sortOrder: string | undefined
  // API responses
  aggs: AggItem[]
}

export default function transformAggsBased (ctx: AggsBasedContext) {
  const { chart, fields, getValue, aggs: apiAggs, config, theme, sortBy: rspSortBy, sortOrder: rspSortOrder } = ctx

  const fill = chart.area || (chart.type === 'multi-line' && ctx.stacked === 'true')

  let aggs = apiAggs
  const sortBy = rspSortBy || chart.config.aggSortBy
  const sortOrder = rspSortOrder || chart.config.sortOrder
  if (chart.config.groupBy?.type === 'date' && sortBy === 'label') {
    aggs = fillMissingDateAggs(aggs, chart.config.groupBy.interval || 'value', sortOrder)
  } else if (sortBy === 'label') {
    const groupByField = chart.config.groupBy.field
    aggs = [...aggs].sort((a, b) => {
      const labelA = (fields[groupByField]?.['x-labels']?.[a.value as string] || (a.value as string)) + ''
      const labelB = (fields[groupByField]?.['x-labels']?.[b.value as string] || (b.value as string)) + ''
      return sortOrder === 'desc' ? labelB.localeCompare(labelA, 'fr') : labelA.localeCompare(labelB, 'fr')
    })
  }

  const limitedAggs = aggs.slice(0, chart.config.size)
  const rawLabels = limitedAggs.map((a) => (a.value as any) + '')
  const shouldFormatDateLabels = chart.config.groupBy?.type === 'date'
  const dateInterval = chart.config.groupBy?.interval || 'value'
  const labels = shouldFormatDateLabels
    ? rawLabels.map((val) => formatDateLabel(val, dateInterval))
    : rawLabels.map((a) => fields[chart.config.groupBy.field]?.['x-labels']?.[a] || a)
  let datasets: any[]

  if (chart.config.color) {
    const color = chart.config.color.type === 'custom' ? chart.config.color.hexValue : theme.colors[chart.config.color.strValue!]
    datasets = [{
      borderColor: color,
      backgroundColor: color,
      data: limitedAggs.map((a) => getValue(chart.config.valueCalc && chart.config.valueCalc.type === 'metric' ? a.metric : a.total)),
      pointStyle: chart.hidePoints ? false : 'circle',
      fill
    }]
  } else {
    if (chart.config.groupsField) {
      let series: string[]
      if (chart.config.colorOrder?.type === 'manual') {
        series = chart.config.colorOrder.entries.map((s: any) => s.key)
      } else {
        const seriesSet = [...new Set(([] as string[]).concat(...aggs.map((a) => (a.aggs || []).map((ag) => ag.value + ''))))]
        series = getOrderedLabels(seriesSet, chart.config.colorOrder)
      }
      const colors = getColors(series, chart.config.colorOrder)
      datasets = series.map((label) => ({
        label: fields[chart.config.groupsField]?.['x-labels']?.[label] || label,
        borderColor: colors[label],
        backgroundColor: colors[label],
        pointStyle: chart.hidePoints ? false : 'circle',
        fill,
        data: limitedAggs.map((a) => {
          const val = (a.aggs || []).find((ag) => (ag.value + '') === label)
          return val ? getValue(chart.config.valueCalc && chart.config.valueCalc.type === 'metric' ? val.metric : val.total) : undefined
        })
      }))
      if (chart.percentage) {
        for (const i in datasets[0].data as number[]) {
          const sum = datasets.reduce((acc: number, d) => acc + ((d.data as number[])[i] || 0), 0)
          if (sum) datasets.forEach((d) => { (d.data as number[])[i] *= 100 / sum })
        }
      }
    } else {
      if (chart.config.type === 'aggsBasedCategories') {
        const valuesCalc = getOrderedLabels(chart.config.valuesCalc, chart.config.colorOrder)
        const colors = getColors(valuesCalc, chart.config.colorOrder)
        const metricField = chart.config.valuesCalc?.[0]
        datasets = valuesCalc.map((field) => ({
          label: chart.config.removeFromLabels
            ? ((fields[field].label || fields[field].title || fields[field]['x-originalName'] || field) as string).replace(chart.config.removeFromLabels, '')
            : (fields[field].label || fields[field].title || fields[field]['x-originalName'] || field) as string,
          borderColor: colors[field],
          backgroundColor: colors[field],
          pointStyle: chart.hidePoints ? false : 'circle',
          fill,
          data: aggs.map((a) => getValue(field === metricField ? a.metric : (a as any)[field + '_' + chart.config.metric]))
        }))
        if (chart.percentage) {
          for (const i in datasets[0].data as number[]) {
            const sum = datasets.reduce((acc: number, d) => acc + ((d.data as number[])[i] || 0), 0)
            if (sum) datasets.forEach((d) => { (d.data as number[])[i] *= 100 / sum })
          }
        }
      } else {
        const dataValues = limitedAggs.map((a) => getValue(chart.config.valueCalc && chart.config.valueCalc.type === 'metric' ? a.metric : a.total))

        let orderedRawLabels = getOrderedLabels(rawLabels, chart.config.colorOrder)
        let orderedLabels = shouldFormatDateLabels
          ? orderedRawLabels.map((val) => formatDateLabel(val, dateInterval))
          : orderedRawLabels.map((l) => fields[chart.config.groupBy.field]?.['x-labels']?.[l] || l)
        let orderedData = orderedRawLabels.map((l) => {
          const index = rawLabels.indexOf(l)
          return dataValues[index]
        })

        if (chart.type === 'pie' && apiAggs.length > chart.config.size) {
          orderedRawLabels.push('Autre')
          orderedLabels.push('Autre')
          const otherSum = apiAggs.slice(chart.config.size).reduce((acc: number, a) => acc + (chart.config.valueCalc && chart.config.valueCalc.type === 'metric' ? a.metric : a.total)!, 0)
          orderedData.push(getValue(otherSum))
        }

        const colors = getColors(orderedRawLabels, chart.config.colorOrder)
        datasets = [{
          labels: orderedLabels,
          borderColor: chart.type === 'pie' ? 'white' : orderedRawLabels.map((l) => colors[l]),
          backgroundColor: orderedRawLabels.map((l) => colors[l] || chart.config.colorOrder?.defaultColor || '#828282'),
          data: orderedData
        }]

        if (['percentages', 'both'].includes(chart.display as string)) {
          const sum = datasets[0].data.reduce((acc: number, d: number | undefined) => acc + (d || 0), 0)
          datasets[0].percentages = datasets[0].data.map((d: number | undefined) => d! * 100 / sum)
        }

        if (chart.type === 'pie') {
          labels.splice(0, labels.length, ...orderedLabels)
        }
      }
    }
  }

  if (chart.type === 'paired-histogram') {
    datasets[0].data = (datasets[0].data as (number | undefined)[]).map((d) => -(d ?? 0))
  }

  return {
    labels: labels.map((l) => splitString(config.labelsMaxWidth ?? 20, l + '')),
    datasets
  }
}
