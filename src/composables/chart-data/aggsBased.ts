import { ofetch } from 'ofetch'
import { getSortStr, getColors, getOrderedLabels, splitString, formatDateLabel, fillMissingDateAggs } from '@/assets/utils'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import type { ChartDataCtx, AggItem, ValuesAggResponse } from '@/composables/useChartData'
import type { ThemeInstance } from 'vuetify'

export default async function fetchAggsBasedData (ctx: ChartDataCtx, theme: ThemeInstance) {
  const { config, chart, fields, datasetUrl, finalizedAt, baseParams, getValue, displayError, errorMessage, stacked, metric } = ctx

  const fill = chart.value!.area || (chart.value!.type === 'multi-line' && stacked === 'true')
  const params: Record<string, string | number | undefined> = {
    ...baseParams.value,
    size: 0,
    field: chart.value!.config.groupBy!.field,
    interval: chart.value!.config.groupBy!.interval || 'value',
    agg_size: chart.value!.type === 'pie' ? 1000 : chart.value!.config.size,
    sort: getSortStr(chart.value!.config),
    finalizedAt: finalizedAt.value
  }

  if (chart.value!.config.missingLabel) params.missing = chart.value!.config.missingLabel
  if (chart.value!.config.valueCalc?.type === 'metric' || chart.value!.config.valuesCalc) {
    params.metric = metric || chart.value!.config.metric || chart.value!.config.valueCalc!.metric
    const sortByValue = reactiveSearchParams['sort-by'] || chart.value!.config.aggSortBy
    const sortField = sortByValue === 'value' ? (reactiveSearchParams['sort-field'] || chart.value!.config.sortField) : undefined
    params.metric_field = sortField || chart.value!.config.valuesCalc?.[0] || chart.value!.config.valueCalc!.field
    if (chart.value!.config.valuesCalc?.length > 1) {
      const extraMetrics = chart.value!.config.valuesCalc
        .filter((v: string) => v !== params.metric_field)
        .map((v: string) => v + ':' + chart.value!.config.metric)
      if (extraMetrics.length) params.extra_metrics = extraMetrics.join(',')
    }
  }

  if (chart.value!.config.groupsField) {
    params.field = params.field + ';' + chart.value!.config.groupsField
    params.agg_size = params.agg_size + ';12'
    params.sort = params.sort + ';-' + chart.value!.config.valueCalc!.type
  }

  const { aggs: apiAggs } = await ofetch<ValuesAggResponse>(`${datasetUrl.value}/values_agg`, { params }).catch((e) => {
    errorMessage.value = e.status + ' - ' + e.data
    displayError.value = true
    return { aggs: [] }
  })

  let aggs = apiAggs
  const sortBy = reactiveSearchParams['sort-by'] || chart.value!.config.aggSortBy
  const sortOrder = reactiveSearchParams['sort-order'] || chart.value!.config.sortOrder
  if (chart.value!.config.groupBy?.type === 'date' && sortBy === 'label') {
    aggs = fillMissingDateAggs(aggs, chart.value!.config.groupBy!.interval || 'value', sortOrder)
  } else if (sortBy === 'label') {
    const groupByField = chart.value!.config.groupBy!.field
    aggs = [...aggs].sort((a, b) => {
      const labelA = (fields.value[groupByField]?.['x-labels']?.[a.value as string] || (a.value as string)) + ''
      const labelB = (fields.value[groupByField]?.['x-labels']?.[b.value as string] || (b.value as string)) + ''
      return sortOrder === 'desc' ? labelB.localeCompare(labelA, 'fr') : labelA.localeCompare(labelB, 'fr')
    })
  }

  const limitedAggs = aggs.slice(0, chart.value!.config.size)
  const rawLabels = limitedAggs.map((a) => (a.value as any) + '')
  const shouldFormatDateLabels = chart.value!.config.groupBy?.type === 'date'
  const dateInterval = chart.value!.config.groupBy?.interval || 'value'
  const labels = shouldFormatDateLabels
    ? rawLabels.map((val) => formatDateLabel(val, dateInterval))
    : rawLabels.map((a) => fields.value[chart.value!.config.groupBy!.field]?.['x-labels']?.[a] || a)
  let datasets: any[]

  if (chart.value!.config.color) {
    const color = chart.value!.config.color.type === 'custom' ? chart.value!.config.color.hexValue : theme.current.value.colors[chart.value!.config.color.strValue!]
    datasets = [{
      borderColor: color,
      backgroundColor: color,
      data: limitedAggs.map((a) => getValue(chart.value!.config.valueCalc && chart.value!.config.valueCalc.type === 'metric' ? a.metric : a.total)),
      pointStyle: chart.value!.hidePoints ? false : 'circle',
      fill
    }]
  } else {
    if (chart.value!.config.groupsField) {
      let series: string[]
      if (chart.value!.config.colorOrder?.type === 'manual') {
        series = chart.value!.config.colorOrder.entries.map((s: any) => s.key)
      } else {
        const seriesSet = [...new Set(([] as string[]).concat(...aggs.map((a) => (a.aggs || []).map((ag) => ag.value + ''))))]
        series = getOrderedLabels(seriesSet, chart.value!.config.colorOrder)
      }
      const colors = getColors(series, chart.value!.config.colorOrder)
      datasets = series.map((label) => ({
        label: fields.value[chart.value!.config.groupsField]?.['x-labels']?.[label] || label,
        borderColor: colors[label],
        backgroundColor: colors[label],
        pointStyle: chart.value!.hidePoints ? false : 'circle',
        fill,
        data: limitedAggs.map((a) => {
          const val = (a.aggs || []).find((ag) => (ag.value + '') === label)
          return val ? getValue(chart.value!.config.valueCalc && chart.value!.config.valueCalc.type === 'metric' ? val.metric : val.total) : undefined
        })
      }))
      if (chart.value!.percentage) {
        for (const i in datasets[0].data as number[]) {
          const sum = datasets.reduce((acc: number, d) => acc + ((d.data as number[])[i] || 0), 0)
          if (sum) datasets.forEach((d) => { (d.data as number[])[i] *= 100 / sum })
        }
      }
    } else {
      if (chart.value!.config.type === 'aggsBasedCategories') {
        const valuesCalc = getOrderedLabels(chart.value!.config.valuesCalc, chart.value!.config.colorOrder)
        const colors = getColors(valuesCalc, chart.value!.config.colorOrder)
        datasets = valuesCalc.map((field, i) => ({
          label: chart.value!.config.removeFromLabels
            ? ((fields.value[field].label || fields.value[field].title || fields.value[field]['x-originalName'] || field) as string).replace(chart.value!.config.removeFromLabels, '')
            : (fields.value[field].label || fields.value[field].title || fields.value[field]['x-originalName'] || field) as string,
          borderColor: colors[field],
          backgroundColor: colors[field],
          pointStyle: chart.value!.hidePoints ? false : 'circle',
          fill,
          data: aggs.map((a) => getValue(field === params.metric_field ? a.metric : (a as any)[field + '_' + chart.value!.config.metric]))
        }))
        if (chart.value!.percentage) {
          for (const i in datasets[0].data as number[]) {
            const sum = datasets.reduce((acc: number, d) => acc + ((d.data as number[])[i] || 0), 0)
            if (sum) datasets.forEach((d) => { (d.data as number[])[i] *= 100 / sum })
          }
        }
      } else {
        const dataValues = limitedAggs.map((a) => getValue(chart.value!.config.valueCalc && chart.value!.config.valueCalc.type === 'metric' ? a.metric : a.total))

        let orderedRawLabels = getOrderedLabels(rawLabels, chart.value!.config.colorOrder)
        let orderedLabels = shouldFormatDateLabels
          ? orderedRawLabels.map((val) => formatDateLabel(val, dateInterval))
          : orderedRawLabels.map((l) => fields.value[chart.value!.config.groupBy!.field]?.['x-labels']?.[l] || l)
        let orderedData = orderedRawLabels.map((l) => {
          const index = rawLabels.indexOf(l)
          return dataValues[index]
        })

        if (chart.value!.type === 'pie' && apiAggs.length > chart.value!.config.size) {
          orderedRawLabels.push('Autre')
          orderedLabels.push('Autre')
          const otherSum = apiAggs.slice(chart.value!.config.size).reduce((acc: number, a) => acc + (chart.value!.config.valueCalc && chart.value!.config.valueCalc.type === 'metric' ? a.metric : a.total)!, 0)
          orderedData.push(getValue(otherSum))
        }

        const colors = getColors(orderedRawLabels, chart.value!.config.colorOrder)
        datasets = [{
          labels: orderedLabels,
          borderColor: chart.value!.type === 'pie' ? 'white' : orderedRawLabels.map((l) => colors[l]),
          backgroundColor: orderedRawLabels.map((l) => colors[l] || chart.value!.config.colorOrder?.defaultColor || '#828282'),
          data: orderedData
        }]

        if (['percentages', 'both'].includes(chart.value!.display as string)) {
          const sum = datasets[0].data.reduce((acc: number, d: number | undefined) => acc + (d || 0), 0)
          datasets[0].percentages = datasets[0].data.map((d: number | undefined) => d! * 100 / sum)
        }

        if (chart.value!.type === 'pie') {
          labels.splice(0, labels.length, ...orderedLabels)
        }
      }
    }
  }

  if (chart.value!.type === 'paired-histogram') {
    datasets[0].data = (datasets[0].data as (number | undefined)[]).map((d) => -(d ?? 0))
  }

  return {
    labels: labels.map((l) => splitString(config.value.labelsMaxWidth ?? 20, l + '')),
    datasets
  }
}
