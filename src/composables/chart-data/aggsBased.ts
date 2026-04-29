import { ofetch } from 'ofetch'
import { getSortStr, getColors, getOrderedLabels, splitString } from '@/assets/utils'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import type { ChartDataCtx } from '@/composables/useChartData'

export default async function fetchAggsBasedData (ctx: ChartDataCtx, theme: any) {
  const { config, chart, fields, datasetUrl, finalizedAt, baseParams, getValue, displayError, errorMessage, stacked, metric } = ctx

  const fill = chart.value!.area || (chart.value!.type === 'multi-line' && stacked === 'true')
  const params: any = {
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
    const sortByValue = reactiveSearchParams['sort-by'] || chart.value!.config.sortBy
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

  const { aggs } = await ofetch(`${datasetUrl.value}/values_agg`, { params }).catch((e: any) => {
    errorMessage.value = e.status + ' - ' + e.data
    displayError.value = true
    return { aggs: [] }
  })

  const rawLabels = aggs.slice(0, chart.value!.config.size).map((a: any) => a.value)
  const labels = rawLabels.map((a: any) => fields.value[chart.value!.config.groupBy!.field]?.['x-labels']?.[a] || a)
  let datasets: any[]

  if (chart.value!.config.color) {
    const color = chart.value!.config.color.type === 'custom' ? chart.value!.config.color.hexValue : theme.current.value.colors[chart.value!.config.color.strValue!]
    datasets = [{
      borderColor: color,
      backgroundColor: color,
      data: aggs.slice(0, chart.value!.config.size).map((a: any) => getValue(chart.value!.config.valueCalc && chart.value!.config.valueCalc.type === 'metric' ? a.metric : a.total)),
      pointStyle: chart.value!.hidePoints ? false : 'circle',
      fill
    }]
  } else {
    if (chart.value!.config.groupsField) {
      let series: string[]
      if (chart.value!.config.colorOrder?.type === 'manual') {
        series = chart.value!.config.colorOrder.entries.map((s: any) => s.key)
      } else {
        const seriesSet = [...new Set([].concat(...aggs.map((a: any) => a.aggs.map((ag: any) => ag.value + ''))) as string[])]
        series = getOrderedLabels(seriesSet, chart.value!.config.colorOrder)
      }
      const colors = getColors(series, chart.value!.config.colorOrder)
      datasets = series.map((label: string) => ({
        label: fields.value[chart.value!.config.groupsField]?.['x-labels']?.[label] || label,
        borderColor: colors[label],
        backgroundColor: colors[label],
        pointStyle: chart.value!.hidePoints ? false : 'circle',
        fill,
        data: aggs.slice(0, chart.value!.config.size).map((a: any) => {
          const val = a.aggs.find((ag: any) => (ag.value + '') === label)
          return val ? getValue(chart.value!.config.valueCalc && chart.value!.config.valueCalc.type === 'metric' ? val.metric : val.total) : undefined
        })
      }))
      if (chart.value!.percentage) {
        for (const i in datasets[0].data) {
          const sum = datasets.reduce((acc: number, d: any) => acc + (d.data[i] || 0), 0)
          if (sum) datasets.forEach((d: any) => { d.data[i] *= 100 / sum })
        }
      }
    } else {
      if (chart.value!.config.type === 'aggsBasedCategories') {
        const valuesCalc = getOrderedLabels(chart.value!.config.valuesCalc, chart.value!.config.colorOrder)
        const colors = getColors(valuesCalc, chart.value!.config.colorOrder)
        datasets = valuesCalc.map((field: string, i: number) => ({
          label: chart.value!.config.removeFromLabels
            ? (fields.value[field].label || fields.value[field].title || fields.value[field]['x-originalName'] || field).replace(chart.value!.config.removeFromLabels, '')
            : (fields.value[field].label || fields.value[field].title || fields.value[field]['x-originalName'] || field),
          borderColor: colors[field],
          backgroundColor: colors[field],
          pointStyle: chart.value!.hidePoints ? false : 'circle',
          fill,
          data: aggs.map((a: any) => getValue(field === params.metric_field ? a.metric : a[field + '_' + chart.value!.config.metric]))
        }))
        if (chart.value!.percentage) {
          for (const i in datasets[0].data) {
            const sum = datasets.reduce((acc: number, d: any) => acc + (d.data[i] || 0), 0)
            if (sum) datasets.forEach((d: any) => { d.data[i] *= 100 / sum })
          }
        }
      } else {
        const dataValues = aggs.slice(0, chart.value!.config.size).map((a: any) => getValue(chart.value!.config.valueCalc && chart.value!.config.valueCalc.type === 'metric' ? a.metric : a.total))

        let orderedRawLabels = getOrderedLabels(rawLabels, chart.value!.config.colorOrder)
        let orderedLabels = orderedRawLabels.map((l: string) => fields.value[chart.value!.config.groupBy!.field]?.['x-labels']?.[l] || l)
        let orderedData = orderedRawLabels.map((l: string) => {
          const index = rawLabels.indexOf(l)
          return dataValues[index]
        })

        if (chart.value!.type === 'pie' && aggs.length > chart.value!.config.size) {
          orderedRawLabels.push('Autre')
          orderedLabels.push('Autre')
          const otherSum = aggs.slice(chart.value!.config.size).reduce((acc: number, a: any) => acc + (chart.value!.config.valueCalc && chart.value!.config.valueCalc.type === 'metric' ? a.metric : a.total), 0)
          orderedData.push(getValue(otherSum))
        }

        const colors = getColors(orderedRawLabels, chart.value!.config.colorOrder)
        datasets = [{
          labels: orderedLabels,
          borderColor: chart.value!.type === 'pie' ? 'white' : orderedRawLabels.map((l: string) => colors[l]),
          backgroundColor: orderedRawLabels.map((l: string) => colors[l] || chart.value!.config.colorOrder?.defaultColor || '#828282'),
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
    datasets[0].data = datasets[0].data.map((d: number | undefined) => -(d ?? 0))
  }

  return {
    labels: labels.map((l: string) => splitString(config.value.labelsMaxWidth ?? 20, l + '')),
    datasets
  }
}
