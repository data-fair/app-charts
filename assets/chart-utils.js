import prepareData from './chart-data.js'
const Color = require('color-js')

function formatValue(value, maxLength) {
  if (typeof value === 'number') return value.toLocaleString()
  const str = '' + value
  return str.length > maxLength ? str.slice(0, maxLength) + '...' : str
}

function getXAxes(config) {
  if (config.chart.groupBy && config.chart.groupBy.type === 'date') {
    return { type: 'time', time: { unit: config.chart.groupBy.interval } }
  } else {
    return {
      ticks: {
        callback(value) {
          return formatValue(value, 12)
        }
      }
    }
  }
}

function getYAxes(config) {
  return {
    ticks: {
      beginAtZero: true,
      callback(value) {
        return formatValue(value, 12)
      }
    }
  }
}

const tooltips = {
  callbacks: {
    title(tooltipItems, data) {
      const value = data.labels[tooltipItems[0].index]
      // title might be truncated in tooltip, but not as much as in xAxis labels
      return formatValue(value, 50)
    },
    label(tooltipItem, data) {
      const value = tooltipItem.yLabel
      let label
      if (tooltipItem.datasetIndex !== undefined) {
        label = data.datasets[tooltipItem.datasetIndex].label
      }
      if (label) return `${formatValue(label, 20)}: ${formatValue(value, 40)}`
      else return formatValue(value, 40)
    }
  }
}

function getStackedTooltips(data) {
  // when there are many items, better not to generate a huge tooltip
  if (data.datasets.length > 10) return tooltips
  // otherwise an aggregated tooltip is handy
  return { mode: 'index', intersect: false, ...tooltips }
}

const chartOptions = {}
chartOptions.bar = (config, data) => {
  return {
    type: config.chart.render.horizontal ? 'horizontalBar' : 'bar',
    data,
    options: {
      title: { display: true, text: chartTitle(config) },
      legend: { display: false },
      scales: {
        xAxes: [getXAxes(config)],
        yAxes: [getYAxes(config)]
      },
      tooltips
    }
  }
}

chartOptions['stacked-bar'] = (config, data) => {
  return {
    type: config.chart.render.horizontal ? 'horizontalBar' : 'bar',
    data,
    options: {
      title: { display: true, text: chartTitle(config) },
      tooltips: getStackedTooltips(data),
      scales: {
        xAxes: [{
          stacked: true,
          ...getXAxes(config)
        }],
        yAxes: [{
          stacked: true,
          ...getYAxes(config)
        }]
      }
    }
  }
}

chartOptions['grouped-bar'] = (config, data) => {
  return {
    type: config.chart.render.horizontal ? 'horizontalBar' : 'bar',
    data,
    options: {
      title: { display: true, text: chartTitle(config) },
      tooltips,
      scales: {
        xAxes: [getXAxes(config)],
        yAxes: [getYAxes(config)]
      }
    }
  }
}

chartOptions.pie = (config, data) => {
  return {
    type: 'pie',
    data,
    options: {
      title: { display: true, text: chartTitle(config) },
      tooltips
    }
  }
}

chartOptions.line = (config, data) => {
  data.datasets.forEach(dataset => {
    dataset.fill = false
  })
  return {
    type: 'line',
    data,
    options: {
      legend: { display: false },
      title: { display: true, text: chartTitle(config) },
      scales: {
        xAxes: [getXAxes(config)],
        yAxes: [getYAxes(config)]
      },
      tooltips
    }
  }
}

chartOptions['multi-lines'] = (config, data) => {
  data.datasets.forEach(dataset => {
    dataset.fill = false
  })
  return {
    type: 'line',
    data,
    options: {
      title: { display: true, text: chartTitle(config) },
      scales: {
        xAxes: [getXAxes(config)],
        yAxes: [getYAxes(config)]
      },
      tooltips: getStackedTooltips(data)
    }
  }
}

chartOptions.area = (config, data) => {
  data.datasets.forEach(dataset => {
    dataset.backgroundColor = Color(dataset.borderColor).setAlpha(0.5).toCSS()
  })
  return {
    type: 'line',
    data,
    options: {
      legend: { display: false },
      title: { display: true, text: chartTitle(config) },
      scales: {
        xAxes: [getXAxes(config)],
        yAxes: [getYAxes(config)]
      },
      tooltips
    }
  }
}

chartOptions['stacked-area'] = (config, data) => {
  data.datasets.forEach(dataset => {
    // dataset.backgroundColor = Color(dataset.backgroundColor).lightenByRatio(0.05).toCSS()
    dataset.borderColor = Color(dataset.borderColor).darkenByRatio(0.25).toCSS()
  })
  return {
    type: 'line',
    data,
    options: {
      title: { display: true, text: chartTitle(config) },
      tooltips: getStackedTooltips(data),
      scales: {
        xAxes: [{
          stacked: true,
          ...getXAxes(config)
        }],
        yAxes: [{
          stacked: true,
          ...getYAxes(config)
        }]
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
      legend: { display: false },
      title: { display: true, text: chartTitle(config) },
      scales: {
        xAxes: [getXAxes(config)],
        yAxes: [getYAxes(config)]
      },
      tooltips
    }
  }
}

chartOptions['multi-radars'] = (config, data) => {
  data.datasets.forEach(dataset => {
    dataset.fill = false
  })
  return {
    type: 'radar',
    data,
    options: {
      title: { display: true, text: chartTitle(config) },
      scales: {
        xAxes: [getXAxes(config)],
        yAxes: [getYAxes(config)]
      },
      tooltips
    }
  }
}

const metricTypes = [
  { value: 'count', text: `Nombre de documents` },
  { value: 'min', text: 'Valeur min' },
  { value: 'max', text: 'Valeur max' },
  { value: 'sum', text: 'Somme' },
  { value: 'avg', text: 'Moyenne' }
]

function chartTitle(config) {
  if (config.title) return config.title
  if (config.chart.type === 'linesBased') return ''
  if (config.chart.type === 'countBased') return 'Nombre de documents'
  const metricType = metricTypes.find(m => m.value === config.chart.metricType)
  let label = metricType.text + ' de ' + config.chart.valueField.label
  if (config.chart.groupBy && config.chart.groupBy.field) label += ' par ' + config.chart.groupBy.field.label
  if (config.chart.secondGroupByField) label += ' et par ' + config.chart.secondGroupByField.label
  return label
}

function prepareChart(config, data) {
  if (!chartOptions[config.chart.render.type]) new Error('Type de graphique non supporté ' + config.chart.render.type)
  return chartOptions[config.chart.render.type](config, prepareData(config, data))
}

export default { prepareChart, prepareData, chartTitle }
