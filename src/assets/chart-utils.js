import prepareData from './chart-data.js'
import Color from 'color-js'

function formatValue(value, maxLength) {
  if (typeof value === 'number') return value.toLocaleString()
  const str = '' + value
  return str.length > maxLength ? str.slice(0, maxLength) + '...' : str
}

function getXAxes(config, data) {
  if (config.dataType.groupBy && config.dataType.groupBy.type === 'date') {
    return { type: 'time', time: { unit: config.dataType.groupBy.interval } }
  } else {
    return {
      ticks: {
        callback(value) {
          return formatValue(data.labels[value], 12)
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
    title: (tooltipItems) => {
      const value = tooltipItems[0].label
      // title might be truncated in tooltip, but not as much as in xAxis labels
      return formatValue(value, 50)
    },
    label: (tooltipItem) => {
      const label = tooltipItem.label || ''
      const value = tooltipItem.raw
      return `${formatValue(label, 20)}: ${formatValue(value, 40)}`
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
    type: 'bar',
    data,
    options: {
      indexAxis: config.chartType.horizontal ? 'y' : 'x',
      plugins: {
        title: { display: true, text: chartTitle(config) },
        legend: { display: false },
        tooltip: tooltips
      },
      scales: {
        x: getXAxes(config, data),
        y: getYAxes(config)
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
          ...getXAxes(config, data)
        },
        y: {
          stacked: true,
          ...getYAxes(config)
        }
      }
    }
  }
}

chartOptions['grouped-bar'] = (config, data) => {
  data.datasets.forEach(dataset => {
    dataset.borderColor = Color(dataset.backgroundColor).setAlpha(0.5).toCSS()
    dataset.borderWidth = 1
  })
  return {
    type: 'bar',
    data,
    options: {
      indexAxis: config.chartType.horizontal ? 'y' : 'x',
      plugins: {
        title: { display: true, text: chartTitle(config) },
        tooltip: tooltips
      },
      scales: {
        x: getXAxes(config, data),
        y: getYAxes(config)
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
      tooltip: tooltips
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
        tooltip: tooltips
      },
      scales: {
        x: getXAxes(config, data),
        y: getYAxes(config)
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
        tooltip: tooltips
      },
      scales: {
        x: getXAxes(config, data),
        y: getYAxes(config)
      }
    }
  }
}

chartOptions.area = (config, data) => {
  data.datasets.forEach(dataset => {
    dataset.backgroundColor = Color(dataset.borderColor).setAlpha(0.5).toCSS()
    dataset.fill = true
  })
  return {
    type: 'line',
    data,
    options: {
      plugins: {
        legend: { display: false },
        title: { display: true, text: chartTitle(config) },
        tooltip: tooltips
      },
      scales: {
        x: getXAxes(config, data),
        y: getYAxes(config)
      }
    }
  }
}

chartOptions['multi-area'] = (config, data) => {
  data.datasets.forEach(dataset => {
    // dataset.backgroundColor = Color(dataset.backgroundColor).lightenByRatio(0.05).toCSS()
    dataset.borderColor = Color(dataset.borderColor).darkenByRatio(0.25).toCSS()
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
          ...getXAxes(config, data)
        },
        y: {
          stacked: true,
          ...getYAxes(config)
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
        tooltip: tooltips
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
        tooltip: tooltips
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
