import getColors from './colors'

// From data-fair response data to the data object expected by chartjs
export default function prepareData(config, data) {
  if (config.dataType.type === 'linesBased') return prepareLinesData(config, data)
  else return prepareAggData(config, data)
}

function prepareLinesData(config, data) {
  if (config.chartType.type === 'pie' && config.dataType.valuesFields.length > 1) {
    throw new Error('La visualisation camembert ne supporte pas d\'afficher plusieurs niveaux.')
  }
  const colors = config.chartType.type === 'pie'
    ? [getColors(config.colorscheme, data.results.length)]
    : getColors(config.colorscheme, config.dataType.valuesFields.length)

  const xLabels = config.dataType.labelsField['x-labels']
  if (Array.isArray(config.dataType.valuesFields) && config.dataType.labelsField) {
    if (!Array.isArray(data.results)) {
      console.error('data.results is not an array')
      return { labels: [], datasets: [] }
    }
    return {
      labels: data.results.map(r => (xLabels && xLabels[r[config.dataType.labelsField.key]]) || r[config.dataType.labelsField.key]),
      datasets: config.dataType.valuesFields.map((f, i) => {
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
  } else {
    console.error('valuesFields or labelsField is undefined or not an array')
    return { labels: [], datasets: [] }
  }
}

function prepare2levelAggData(config, data) {
  if (config.chartType.type === 'pie') {
    throw new Error('La visualisation camembert ne supporte pas d\'afficher plusieurs niveaux.')
  }

  const labels = []
  const datasets = []
  const totalDataset = { label: 'Total', data: [] }
  const xLabels = config.dataType.groupBy.field['x-labels']
  const secondaryXLabels = config.dataType.secondGroupBy.field['x-labels']
  data.aggs.forEach((firstLevel, i) => {
    labels.push((xLabels && xLabels[firstLevel.value]) || firstLevel.value)
    totalDataset.data.push(config.dataType.type !== 'countBased' ? firstLevel.metric : firstLevel.total)
    firstLevel.aggs.forEach(secondLevel => {
      let dataset = datasets.find(d => d.key === secondLevel.value)
      if (!dataset) {
        dataset = {
          key: secondLevel.value,
          label: (secondaryXLabels && secondaryXLabels[secondLevel.value]) || secondLevel.value,
          data: []
        }
        datasets.push(dataset)
      }
      if (config.dataType.type === 'countBased') {
        dataset.data[i] = secondLevel.total
      } else {
        dataset.data[i] = secondLevel.metric
      }
      dataset.totalSort = (dataset.totalCount || 0) + dataset.data[i]
    })
  })
  if (datasets.length > 60) throw new Error(`Le graphique essaie d'afficher un nombre trop important de séries (${datasets.length})`)
  const sort = config.dataType.secondSort || (config.dataType.type === 'countBased' ? '-count' : '-metric')
  if (sort === '-count' || sort === '-metric') datasets.sort((a, b) => a.totalSort < b.totalSort ? 1 : -1)
  if (sort === 'metric') datasets.sort((a, b) => a.totalSort < b.totalSort ? 1 : -1)
  else if (sort === 'key') datasets.sort((a, b) => a.key < b.key ? -1 : 1)
  else if (sort === '-key') datasets.sort((a, b) => a.key < b.key ? 1 : -1)
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
  if (config.chartType.showTotal) datasets.push(totalDataset)
  return { labels, datasets }
}

function prepareAggData(config, data) {
  if (data.aggs.length > 1000) {
    throw new Error('Nombre d\'éléments à afficher trop important. Abandon.')
  }
  if (config.dataType.secondGroupBy && config.dataType.secondGroupBy.field && config.dataType.secondGroupBy.field.key) {
    return prepare2levelAggData(config, data)
  } else {
    const backgroundColor = config.chartType.type === 'pie' ? getColors(config.colorscheme, data.aggs.length) : getColors(config.colorscheme, 1)[0]
    const xLabels = config.dataType.groupBy.field['x-labels']
    return {
      labels: data.aggs.map(agg => (xLabels && xLabels[agg.value]) || agg.value),
      datasets: [{
        data: data.aggs.map(agg => config.dataType.type !== 'countBased' ? agg.metric : agg.total),
        backgroundColor,
        borderColor: backgroundColor
      }]
    }
  }
}