import getColors from './colors'

// From data-fair response data to the data object expected by chartjs
export default function prepareData(config, data) {
  if (config.chart.type === 'linesBased') return prepareLinesData(config, data)
  else return prepareAggData(config, data)
}

function prepareLinesData(config, data) {
  const colors = getColors(config.colorscheme, config.chart.valuesFields.length)
  return {
    labels: data.results.map(r => r[config.chart.labelsField.key]),
    datasets: config.chart.valuesFields.map((f, i) => {
      const backgroundColor = colors[i]
      return {
        data: data.results.map(r => r[f.key]),
        key: f.key,
        label: f.label,
        backgroundColor,
        borderColor: backgroundColor
      }
    })
  }
}

function prepareAggData(config, data) {
  if (data.aggs.length > 1000) {
    throw new Error(`Nombre d'éléments à afficher trop important. Abandon.`)
  }
  const rType = config.chart.render.type
  const twoLevels = rType.startsWith('stacked') || rType.startsWith('grouped') || rType.startsWith('multi')
  if (!twoLevels) {
    const backgroundColor = config.chart.render.type === 'pie' ? getColors(config.colorscheme, data.aggs.length) : getColors(config.colorscheme, 1)[0]
    return {
      labels: data.aggs.map(agg => agg.value),
      datasets: [{
        data: data.aggs.map(agg => config.chart.type !== 'countBased' ? agg.metric : agg.total),
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
      totalDataset.data.push(config.chart.type !== 'countBased' ? firstLevel.metric : firstLevel.total)
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
        dataset.data[i] = config.chart.type !== 'countBased' ? secondLevel.metric : secondLevel.total
      })
    })
    datasets.sort((a, b) => a.key < b.key ? -1 : 1)
    const colors = getColors(config.colorscheme, datasets.length)
    datasets.forEach((d, i) => {
      d.backgroundColor = colors[i]
      d.borderColor = d.backgroundColor
      // Fill empty slots in the array with 0 values
      // WARNING: depending on the metric (min ?) this might not make sense
      // But we can't use sparse syntax ({x:.., y:..}) for a "Category" x axis
      for (let i = 0; i < labels.length; i++) {
        if (d.data[i] === undefined) d.data[i] = 0
      }
    })
    if (config.chart.render.showTotal) datasets.push(totalDataset)
    return { labels, datasets }
  }
}
