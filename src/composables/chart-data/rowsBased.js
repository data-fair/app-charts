/**
 * @param {object} ctx
 * @param {import('vue').Ref} ctx.config
 * @param {import('vue').Ref} ctx.chart
 * @param {import('vue').Ref} ctx.fields
 * @param {import('vue').Ref} ctx.datasetUrl
 * @param {import('vue').Ref} ctx.finalizedAt
 * @param {import('vue').Ref} ctx.baseParams
 * @param {Function} ctx.getValue
 * @param {import('vue').Ref} ctx.displayError
 * @param {import('vue').Ref} ctx.errorMessage
 * @param {Array<{value:string,label:string}>} ctx.categories
 */

import { ofetch } from 'ofetch'
import { getSortStr, getColors, splitString } from '@/assets/utils'

export default async function fetchRowsBasedData (ctx, theme) {
  const { config, chart, fields, datasetUrl, finalizedAt, baseParams, getValue, displayError, errorMessage, stacked, categories: existingCategories } = ctx

  const fill = chart.value.area || (chart.value.type === 'multi-line' && stacked === 'true')
  const select = [chart.value.config.labelsField].concat(chart.value.config.valuesField || chart.value.config.valuesFields)
  const params = {
    ...baseParams.value,
    size: chart.value.type === 'pie' ? 10000 : chart.value.config.size,
    sort: getSortStr(chart.value.config),
    finalizedAt: finalizedAt.value
  }

  let categories = existingCategories
  if (chart.value.config.categoriesField) {
    select.push(chart.value.config.categoriesField)
    if (!categories) {
      categories = await ofetch(`${datasetUrl.value}/values-labels/${chart.value.config.categoriesField}`).catch(e => {
        errorMessage.value = e.status + ' - ' + e.data
        displayError.value = true
        return []
      })
    }
  }

  params.select = select.join(',')
  const { results } = await ofetch(`${datasetUrl.value}/lines`, { params }).catch(e => {
    errorMessage.value = e.status + ' - ' + e.data
    displayError.value = true
    return { results: [] }
  })

  const labels = results.map(r => fields.value[chart.value.config.labelsField]?.['x-labels']?.[r[chart.value.config.labelsField]] || r[chart.value.config.labelsField]).slice(0, chart.value.config.size)
  let datasets

  if (chart.value.config.color) {
    const color = chart.value.config.color.type === 'custom' ? chart.value.config.color.hexValue : theme.current.value.colors[chart.value.config.color.strValue]
    datasets = [{
      borderColor: color,
      backgroundColor: color,
      data: results.map(r => getValue(r[chart.value.config.valuesField])),
      pointStyle: chart.value.hidePoints ? false : 'circle',
      fill
    }]
  } else {
    const rawLabels = results.slice(0, chart.value.config.size).map(r => r[chart.value.config.labelsField])
    if (chart.value.type === 'pie' && results.length > chart.value.config.size) {
      labels.push('Autre')
      rawLabels.push('Autre')
    }
    const colors = getColors(categories?.map(c => c.value) || (chart.value.config.valuesField && rawLabels) || chart.value.config.valuesFields, chart.value.config.colors)

    if (chart.value.config.valuesField) {
      if (categories) {
        datasets = categories.map(({ value, label }) => ({
          label: label || value,
          borderColor: colors[value],
          backgroundColor: colors[value],
          pointStyle: chart.value.hidePoints ? false : 'circle',
          fill,
          data: results.map(r => (r[chart.value.config.categoriesField] === value && getValue(r[chart.value.config.valuesField])) || undefined)
        }))
      } else {
        datasets = [{
          labels,
          borderColor: chart.value.type === 'pie' ? 'white' : rawLabels.map(l => colors[l]),
          backgroundColor: rawLabels.map(l => colors[l] || chart.value.config.colors?.defaultColor || '#828282'),
          data: results.slice(0, chart.value.config.size).map(r => getValue(r[chart.value.config.valuesField]))
        }]
        if (chart.value.type === 'pie' && results.length > chart.value.config.size) {
          const otherSum = results.slice(chart.value.config.size).reduce((acc, r) => acc + r[chart.value.config.valuesField], 0)
          datasets[0].data.push(getValue(otherSum))
          datasets[0].backgroundColor.push(chart.value.config.colors?.defaultColor || '#828282')
        }
        if (['percentages', 'both'].includes(chart.value.display)) {
          const sum = datasets[0].data.reduce((acc, d) => acc + (d || 0), 0)
          datasets[0].percentages = datasets[0].data.map(d => d * 100 / sum)
        }
      }
    } else {
      datasets = chart.value.config.valuesFields.map(field => ({
        label: chart.value.config.removeFromLabels
          ? (fields.value[field].label || fields.value[field].title || fields.value[field]['x-originalName'] || field).replace(chart.value.config.removeFromLabels, '')
          : (fields.value[field].label || fields.value[field].title || fields.value[field]['x-originalName'] || field),
        borderColor: colors[field],
        backgroundColor: colors[field],
        pointStyle: chart.value.hidePoints ? false : 'circle',
        fill,
        data: results.map(r => getValue(r[field]))
      }))
      if (chart.value.percentage) {
        for (const i in datasets[0].data) {
          const sum = datasets.reduce((acc, d) => acc + (d.data[i] || 0), 0)
          if (sum) datasets.forEach(d => { d.data[i] *= 100 / sum })
        }
      }
    }
  }

  if (chart.value.type === 'paired-histogram') {
    datasets[0].data = datasets[0].data.map(d => -d)
  }

  return {
    labels: labels.map(l => splitString(config.value.labelsMaxWidth, l + '')),
    datasets,
    categories
  }
}
