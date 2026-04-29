import { ofetch } from 'ofetch'
import { getSortStr, getColors, splitString } from '@/assets/utils'
import type { ChartDataCtx } from '@/composables/useChartData'

export default async function fetchRowsBasedData (ctx: ChartDataCtx, theme: any) {
  const { config, chart, fields, datasetUrl, finalizedAt, baseParams, getValue, displayError, errorMessage, stacked, categories: existingCategories } = ctx

  const fill = chart.value!.area || (chart.value!.type === 'multi-line' && stacked === 'true')
  const select = [chart.value!.config.labelsField!].concat(chart.value!.config.valuesField || chart.value!.config.valuesFields || [])
  const params: any = {
    ...baseParams.value,
    size: chart.value!.type === 'pie' ? 10000 : chart.value!.config.size,
    sort: getSortStr(chart.value!.config),
    finalizedAt: finalizedAt.value
  }

  let categories = existingCategories
  if (chart.value!.config.categoriesField) {
    select.push(chart.value!.config.categoriesField)
    if (!categories) {
      categories = await ofetch(`${datasetUrl.value}/values-labels/${chart.value!.config.categoriesField}`).catch((e: any) => {
        errorMessage.value = e.status + ' - ' + e.data
        displayError.value = true
        return []
      })
    }
  }

  params.select = select.join(',')
  const { results } = await ofetch(`${datasetUrl.value}/lines`, { params }).catch((e: any) => {
    errorMessage.value = e.status + ' - ' + e.data
    displayError.value = true
    return { results: [] }
  })

  const labels = results.map((r: any) => fields.value[chart.value!.config.labelsField!]?.['x-labels']?.[r[chart.value!.config.labelsField!]] || r[chart.value!.config.labelsField!]).slice(0, chart.value!.config.size)
  let datasets: any[]

  if (chart.value!.config.color) {
    const color = chart.value!.config.color.type === 'custom' ? chart.value!.config.color.hexValue : theme.current.value.colors[chart.value!.config.color.strValue!]
    datasets = [{
      borderColor: color,
      backgroundColor: color,
      data: results.map((r: any) => getValue(r[chart.value!.config.valuesField!])),
      pointStyle: chart.value!.hidePoints ? false : 'circle',
      fill
    }]
  } else {
    const rawLabels = results.slice(0, chart.value!.config.size).map((r: any) => r[chart.value!.config.labelsField!])
    if (chart.value!.type === 'pie' && results.length > chart.value!.config.size) {
      labels.push('Autre')
      rawLabels.push('Autre')
    }
    const colors = getColors(categories?.map((c: any) => c.value) || (chart.value!.config.valuesField && rawLabels) || chart.value!.config.valuesFields || [], chart.value!.config.colors)

    if (chart.value!.config.valuesField) {
      if (categories) {
        let sortedCategories = categories
        const groupSort = chart.value!.config.groupSort
        if (groupSort?.length) {
          sortedCategories = [...categories].sort((a: any, b: any) => {
            const aIdx = groupSort.indexOf(a.value + '')
            const bIdx = groupSort.indexOf(b.value + '')
            if (aIdx === -1 && bIdx === -1) return 0
            if (aIdx === -1) return 1
            if (bIdx === -1) return -1
            return aIdx - bIdx
          })
        }
        datasets = sortedCategories.map(({ value, label }: any) => ({
          label: label || value,
          borderColor: colors[value],
          backgroundColor: colors[value],
          pointStyle: chart.value!.hidePoints ? false : 'circle',
          fill,
          data: results.map((r: any) => (r[chart.value!.config.categoriesField!] === value && getValue(r[chart.value!.config.valuesField!])) || undefined)
        }))
      } else {
        datasets = [{
          labels,
          borderColor: chart.value!.type === 'pie' ? 'white' : rawLabels.map((l: string) => colors[l]),
          backgroundColor: rawLabels.map((l: string) => colors[l] || chart.value!.config.colors?.defaultColor || '#828282'),
          data: results.slice(0, chart.value!.config.size).map((r: any) => getValue(r[chart.value!.config.valuesField!]))
        }]
        if (chart.value!.type === 'pie' && results.length > chart.value!.config.size) {
          const otherSum = results.slice(chart.value!.config.size).reduce((acc: number, r: any) => acc + r[chart.value!.config.valuesField!], 0)
          datasets[0].data.push(getValue(otherSum))
          datasets[0].backgroundColor.push((chart.value!.config.colors as any)?.defaultColor || '#828282')
        }
        if (['percentages', 'both'].includes(chart.value!.display as string)) {
          const sum = datasets[0].data.reduce((acc: number, d: number | undefined) => acc + (d || 0), 0)
          datasets[0].percentages = datasets[0].data.map((d: number | undefined) => d! * 100 / sum)
        }
      }
    } else {
      let valuesFields = chart.value!.config.valuesFields || []
      const groupSort = chart.value!.config.groupSort
      if (groupSort?.length) {
        valuesFields = [...valuesFields].sort((a: string, b: string) => {
          const aIdx = groupSort.indexOf(a)
          const bIdx = groupSort.indexOf(b)
          if (aIdx === -1 && bIdx === -1) return 0
          if (aIdx === -1) return 1
          if (bIdx === -1) return -1
          return aIdx - bIdx
        })
      }
      datasets = valuesFields.map((field: string) => ({
        label: chart.value!.config.removeFromLabels
          ? (fields.value[field].label || fields.value[field].title || fields.value[field]['x-originalName'] || field).replace(chart.value!.config.removeFromLabels, '')
          : (fields.value[field].label || fields.value[field].title || fields.value[field]['x-originalName'] || field),
        borderColor: colors[field],
        backgroundColor: colors[field],
        pointStyle: chart.value!.hidePoints ? false : 'circle',
        fill,
        data: results.map((r: any) => getValue(r[field]))
      }))
      if (chart.value!.percentage) {
        for (const i in datasets[0].data) {
          const sum = datasets.reduce((acc: number, d: any) => acc + (d.data[i] || 0), 0)
          if (sum) datasets.forEach((d: any) => { d.data[i] *= 100 / sum })
        }
      }
    }
  }

  if (chart.value!.type === 'paired-histogram') {
    datasets[0].data = datasets[0].data.map((d: number | undefined) => -(d ?? 0))
  }

  return {
    labels: labels.map((l: string) => splitString(config.value.labelsMaxWidth ?? 20, l + '')),
    datasets,
    categories
  }
}
