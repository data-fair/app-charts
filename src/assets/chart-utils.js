import { darkenByRatio, setAlpha } from './colors.js'
import prepareData from './chart-data.js'

function formatValue(value, maxLength) {
  if (typeof value === 'number') return value.toLocaleString()
  const str = '' + value
  return str.length > maxLength ? str.slice(0, maxLength) + '...' : str
}

function getXAxisLabels(config, data, value) {
  if (config.dynamicFilters && config.dynamicFilters.values && config.dynamicFilters.values[value]) {
    return formatValue(config.dynamicFilters.values[value], 12)
  } else {
    return formatValue(data.labels[value], 12)
  }
}

function getXAxis(config, data) {
  if (config.dataType.groupBy && config.dataType.groupBy.type === 'date') {
    return { type: 'time', time: { unit: config.dataType.groupBy.interval } }
  } else {
    return {
      ticks: {
        callback(value) {
          return getXAxisLabels(config, data, value)
        }
      }
    }
  }
}

function getYAxis() {
  return {
    ticks: {
      beginAtZero: true,
      callback(value) {
        return formatValue(value, 12)
      }
    }
  }
}

function tooltipTitle(tooltipItems, data) {
  const value = tooltipItems[0].label || data.labels[tooltipItems[0].datasetIndex]
  // title might be truncated in tooltip, but not as much as in xAxis labels
  return formatValue(value, 50)
}

function tooltipLabel(tooltipItem, data) {
  const value = tooltipItem.raw || data.datasets[tooltipItem.datasetIndex].data[tooltipItem.dataIndex]
  let label
  if (tooltipItem.datasetIndex !== undefined) {
    label = data.datasets[tooltipItem.datasetIndex].label
  }
  if (label) return `${formatValue(label, 20)}: ${formatValue(value, 40)}`
  else return formatValue(value, 40)
}

function getSingleTooltips(data) {
  return {
    callbacks: {
      title: (tooltipItems) => tooltipTitle(tooltipItems, data),
      label: (tooltipItem) => tooltipLabel(tooltipItem, data)
    }
  }
}

function getStackedTooltips(data) {
  const customTooltips = {
    callbacks: {
      title: (tooltipItems) => tooltipTitle(tooltipItems, data),
      label: (tooltipItem) => tooltipLabel(tooltipItem, data)
    }
  }
  // when there are many items, better not to generate a huge tooltip
  if (data.datasets.length > 10) return customTooltips
  // otherwise an aggregated tooltip is handy
  return { mode: 'index', intersect: false, ...customTooltips }
}

const chartOptions = {}
chartOptions.bar = (config, data) => {
  return {
    type: 'bar',
    data,
    options: {
      indexAxis: config.chartType.horizontal ? 'y' : 'x',
      plugins: {
        title: { display: true, text: chartTitle(config) },
        legend: { display: false },
        tooltip: getSingleTooltips(data)
      },
      scales: {
        x: getXAxis(config, data),
        y: getYAxis()
      }
    }
  }
}

chartOptions['multi-bar'] = (config, data) => {
  data.datasets.forEach(dataset => {
    dataset.borderColor = 'white'
    dataset.borderWidth = 1
  })
  return {
    type: 'bar',
    data,
    options: {
      indexAxis: config.chartType.horizontal ? 'y' : 'x',
      plugins: {
        title: { display: true, text: chartTitle(config) },
        tooltips: getStackedTooltips(data)
      },
      scales: {
        x: {
          stacked: true,
          ...getXAxis(config, data)
        },
        y: {
          stacked: true,
          ...getYAxis()
        }
      }
    }
  }
}

chartOptions['grouped-bar'] = (config, data) => {
  data.datasets.forEach(dataset => {
    dataset.borderColor = setAlpha(dataset.backgroundColor, 0.5)
    dataset.borderWidth = 1
  })
  return {
    type: 'bar',
    data,
    options: {
      indexAxis: config.chartType.horizontal ? 'y' : 'x',
      plugins: {
        title: { display: true, text: chartTitle(config) },
        tooltip: getSingleTooltips(data)
      },
      scales: {
        x: getXAxis(config, data),
        y: getYAxis()
      }
    }
  }
}

chartOptions.pie = (config, data) => {
  return {
    type: 'pie',
    data,
    options: {
      plugins: {
        title: { display: true, text: chartTitle(config) },
        tooltip: getSingleTooltips(data)
      }
    }
  }
}

chartOptions['multi-pie'] = (config, data) => {
  return {}
}

chartOptions.line = (config, data) => {
  data.datasets.forEach(dataset => {
    dataset.fill = false
  })
  return {
    type: 'line',
    data,
    options: {
      plugins: {
        legend: { display: false },
        title: { display: true, text: chartTitle(config) },
        tooltip: getSingleTooltips(data)
      },
      scales: {
        x: getXAxis(config, data),
        y: getYAxis()
      }
    }
  }
}

chartOptions['multi-line'] = (config, data) => {
  data.datasets.forEach(dataset => {
    dataset.fill = false
  })
  return {
    type: 'line',
    data,
    options: {
      plugins: {
        title: { display: true, text: chartTitle(config) },
        tooltip: getSingleTooltips(data)
      },
      scales: {
        x: getXAxis(config, data),
        y: getYAxis()
      }
    }
  }
}

chartOptions.area = (config, data) => {
  data.datasets.forEach(dataset => {
    dataset.backgroundColor = setAlpha(dataset.backgroundColor, 0.5)
    dataset.fill = true
  })
  return {
    type: 'line',
    data,
    options: {
      plugins: {
        legend: { display: false },
        title: { display: true, text: chartTitle(config) },
        tooltip: getSingleTooltips(data)
      },
      scales: {
        x: getXAxis(config, data),
        y: getYAxis()
      }
    }
  }
}

chartOptions['multi-area'] = (config, data) => {
  data.datasets.forEach(dataset => {
    dataset.backgroundColor = darkenByRatio(dataset.backgroundColor, 0.25)
    dataset.fill = true
  })
  return {
    type: 'line',
    data,
    options: {
      plugins: {
        title: { display: true, text: chartTitle(config) },
        tooltip: getStackedTooltips(data)
      },
      scales: {
        x: {
          stacked: true,
          ...getXAxis(config, data)
        },
        y: {
          stacked: true,
          ...getYAxis()
        }
      }
    }
  }
}

chartOptions.radar = (config, data) => {
  data.datasets.forEach(dataset => {
    dataset.fill = false
  })
  return {
    type: 'radar',
    data,
    options: {
      plugins: {
        legend: { display: false },
        title: { display: true, text: chartTitle(config) },
        tooltip: getSingleTooltips(data)
      }
    }
  }
}

chartOptions['multi-radar'] = (config, data) => {
  data.datasets.forEach(dataset => {
    dataset.fill = false
  })
  return {
    type: 'radar',
    data,
    options: {
      plugins: {
        title: { display: true, text: chartTitle(config) },
        tooltip: getSingleTooltips(data)
      }
    }
  }
}

const metricTypes = [
  { value: 'count', text: 'Nombre de documents' },
  { value: 'min', text: 'Valeur min' },
  { value: 'max', text: 'Valeur max' },
  { value: 'sum', text: 'Somme' },
  { value: 'avg', text: 'Moyenne' }
]

function chartTitle(config) {
  if (config.title) return config.title
  if (config.dataType.type === 'linesBased') return ''
  if (config.dataType.type === 'countBased') return 'Nombre de documents'
  const metricType = metricTypes.find(m => m.value === config.dataType.metricType)
  let label = metricType.text + ' de ' + config.dataType.valueField.label
  if (config.dataType.groupBy && config.dataType.groupBy.field) label += ' par ' + config.dataType.groupBy.field.label
  if (config.dataType.secondGroupByField) label += ' et par ' + config.dataType.secondGroupByField.label
  return label
}

function prepareChart(config, data) {
  let renderType = config.chartType.type
  if (config.dataType.secondGroupBy && config.dataType.secondGroupBy.field && config.dataType.secondGroupBy.field.key) {
    if (renderType === 'bar' && config.chartType.split) renderType = 'grouped-bar'
    else renderType = 'multi-' + renderType
  }
  if (!chartOptions[renderType]) throw new Error('Type de graphique non supporté ' + renderType)
  let ndata = data
  if (data.data) ndata = data.data
  const chart = chartOptions[renderType](config, prepareData(config, ndata))
  chart.options.responsive = false
  return chart
}

export default { prepareChart, prepareData, chartTitle }
