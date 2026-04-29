import { ofetch } from 'ofetch'
import { getSortStr, getColors, getOrderedLabels, splitString } from '@/assets/utils'
import type { ChartDataCtx, CategoryItem, DatasetLine, ValuesLabelsItem } from '@/composables/useChartData'
import type { ThemeInstance } from 'vuetify'

export default async function fetchRowsBasedData (ctx: ChartDataCtx, theme: ThemeInstance) {
  const { config, chart, fields, datasetUrl, finalizedAt, baseParams, getValue, displayError, errorMessage, stacked, categories: existingCategories } = ctx

  const fill = chart.value!.area || (chart.value!.type === 'multi-line' && stacked === 'true')
  const select = [chart.value!.config.labelsField!].concat(chart.value!.config.valuesField || chart.value!.config.valuesFields || [])
  const params: Record<string, string | number | undefined> = {
    ...baseParams.value,
    size: chart.value!.type === 'pie' ? 10000 : chart.value!.config.size,
    sort: getSortStr(chart.value!.config),
    finalizedAt: finalizedAt.value
  }

  let categories = existingCategories
  if (chart.value!.config.categoriesField) {
    select.push(chart.value!.config.categoriesField)
    if (!categories) {
      categories = await ofetch<ValuesLabelsItem[]>(`${datasetUrl.value}/values-labels/${chart.value!.config.categoriesField}`).catch((e) => {
        errorMessage.value = e.status + ' - ' + e.data
        displayError.value = true
        return []
      })
    }
  }

  params.select = select.join(',')
  const { results } = await ofetch<{ results: DatasetLine[] }>(`${datasetUrl.value}/lines`, { params }).catch((e) => {
    errorMessage.value = e.status + ' - ' + e.data
    displayError.value = true
    return { results: [] }
  })

  const labels = results.map((r) => fields.value[chart.value!.config.labelsField!]?.['x-labels']?.[r[chart.value!.config.labelsField!] as string] || r[chart.value!.config.labelsField!] as string).slice(0, chart.value!.config.size)
  let datasets: any[]

  if (chart.value!.config.color) {
    const color = chart.value!.config.color.type === 'custom' ? chart.value!.config.color.hexValue : theme.current.value.colors[chart.value!.config.color.strValue!]
    datasets = [{
      borderColor: color,
      backgroundColor: color,
      data: results.map((r) => getValue(r[chart.value!.config.valuesField!] as number)),
      pointStyle: chart.value!.hidePoints ? false : 'circle',
      fill
    }]
  } else {
    const rawLabels = results.slice(0, chart.value!.config.size).map((r) => r[chart.value!.config.labelsField!] as string)
    if (chart.value!.type === 'pie' && results.length > chart.value!.config.size) {
      labels.push('Autre')
      rawLabels.push('Autre')
    }
    const colors = getColors(categories?.map((c) => c.value) || (chart.value!.config.valuesField && rawLabels) || chart.value!.config.valuesFields || [], chart.value!.config.colorOrder)

    if (chart.value!.config.valuesField) {
      if (categories) {
        const categoryValues = categories.map((c) => c.value + '')
        const orderedValues = getOrderedLabels(categoryValues, chart.value!.config.colorOrder)
        const sortedCategories = orderedValues.map((v) => categories!.find((c) => (c.value + '') === v)!)
        datasets = sortedCategories.map(({ value, label }) => ({
          label: label || value,
          borderColor: colors[value],
          backgroundColor: colors[value],
          pointStyle: chart.value!.hidePoints ? false : 'circle',
          fill,
          data: results.map((r) => (r[chart.value!.config.categoriesField!] === value && getValue(r[chart.value!.config.valuesField!] as number)) || undefined)
        }))
      } else {
        const dataValues = results.slice(0, chart.value!.config.size).map((r) => getValue(r[chart.value!.config.valuesField!] as number))

        let orderedRawLabels = getOrderedLabels(rawLabels, chart.value!.config.colorOrder)
        let orderedLabels = orderedRawLabels.map((l) => fields.value[chart.value!.config.labelsField!]?.['x-labels']?.[l] || l)
        let orderedData = orderedRawLabels.map((l) => {
          const index = rawLabels.indexOf(l)
          return dataValues[index]
        })

        if (chart.value!.type === 'pie' && results.length > chart.value!.config.size) {
          orderedRawLabels.push('Autre')
          orderedLabels.push('Autre')
          const otherSum = results.slice(chart.value!.config.size).reduce((acc, r) => acc + (r[chart.value!.config.valuesField!] as number), 0)
          orderedData.push(getValue(otherSum))
        }

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
    } else {
      const valuesFields = getOrderedLabels(chart.value!.config.valuesFields || [], chart.value!.config.colorOrder)
      datasets = valuesFields.map((field) => ({
        label: chart.value!.config.removeFromLabels
          ? ((fields.value[field].label || fields.value[field].title || fields.value[field]['x-originalName'] || field) as string).replace(chart.value!.config.removeFromLabels, '')
          : (fields.value[field].label || fields.value[field].title || fields.value[field]['x-originalName'] || field) as string,
        borderColor: colors[field],
        backgroundColor: colors[field],
        pointStyle: chart.value!.hidePoints ? false : 'circle',
        fill,
        data: results.map((r) => getValue(r[field] as number))
      }))
      if (chart.value!.percentage) {
        for (const i in datasets[0].data as number[]) {
          const sum = datasets.reduce((acc: number, d) => acc + ((d.data as number[])[i] || 0), 0)
          if (sum) datasets.forEach((d) => { (d.data as number[])[i] *= 100 / sum })
        }
      }
    }
  }

  if (chart.value!.type === 'paired-histogram') {
    datasets[0].data = (datasets[0].data as (number | undefined)[]).map((d) => -(d ?? 0))
  }

  return {
    labels: labels.map((l) => splitString(config.value.labelsMaxWidth ?? 20, l + '')),
    datasets,
    categories
  }
}
