const Color = require('color-js')
const colors = require('./colors')

// From data-fair response data to the data object expected by chartjs
export default function prepareData(config, data) {
  if (config.type === 'linesBased') return prepareLinesData(config, data)
  else return prepareAggData(config, data)
}

function prepareLinesData(config, data) {
  return {
    labels: data.results.map(r => r[config.labelsField.key]),
    datasets: config.valuesFields.map((f, i) => {
      const backgroundColor = f.colorscheme.type === 'material' ? colors.material[i] : f.colorscheme.color
      return {
        data: data.results.map(r => r[f.field.key]),
        key: f.field.key,
        label: f.field.label,
        backgroundColor,
        borderColor: backgroundColor
      }
    })
  }
}

function prepareAggData(config, data) {
  let backgroundColor
  const colorscheme = config.chart && config.chart.colorscheme
  if (colorscheme) {
    if (colorscheme.type === 'monochrome') {
      backgroundColor = colorscheme.mainColor
    } else if (colorscheme.type === 'analogous') {
      backgroundColor = new Color(colorscheme.mainColor).analogousScheme().map(c => c.toCSS())
    } else if (colorscheme.type === 'manual') {
      backgroundColor = colorscheme.colors.map(c => c.color)
    } else if (colorscheme.type === 'material') {
      backgroundColor = colors.material
    }
  }

  if (data.aggs.length > 1000) {
    throw new Error(`Nombre d'éléments à afficher trop important. Abandon.`)
  }

  if (!config.chart.secondGroupByField) {
    return {
      labels: data.aggs.map(agg => agg.value),
      datasets: [{
        data: data.aggs.map(agg => config.metricType !== 'count' ? agg.metric : agg.total),
        backgroundColor,
        borderColor: backgroundColor
      }]
    }
  } else {
    const labels = []
    const datasets = []
    const totalDataset = { label: 'Total', data: [] }
    data.aggs.forEach((firstLevel, i) => {
      labels.push(firstLevel.value)
      totalDataset.data.push(config.metricType !== 'count' ? firstLevel.metric : firstLevel.total)
      firstLevel.aggs.forEach(secondLevel => {
        let dataset = datasets.find(d => d.key === secondLevel.value)
        if (!dataset) {
          dataset = {
            key: secondLevel.value,
            label: secondLevel.value,
            data: []
          }
          datasets.push(dataset)
        }
        dataset.data[i] = config.metricType !== 'count' ? secondLevel.metric : secondLevel.total
      })
    })
    datasets.sort((a, b) => a.key < b.key ? -1 : 1)
    datasets.forEach((d, i) => {
      d.backgroundColor = Array.isArray(backgroundColor) ? backgroundColor[i] : backgroundColor
      d.borderColor = d.backgroundColor
      // Fill empty slots in the array with 0 values
      // WARNING: depending on the metric (min ?) this might not make sense
      // But we can't use sparse syntax ({x:.., y:..}) for a "Category" x axis
      for (let i = 0; i < labels.length; i++) {
        if (d.data[i] === undefined) d.data[i] = 0
      }
    })
    if (config.chart.showTotal) datasets.push(totalDataset)
    return { labels, datasets }
  }
}
