const Color = require('color-js')
const colors = require('./colors')
// From data-fair response data to the data object expected by chartjs
function prepareData(config, data) {
  let backgroundColor
  const colorscheme = config.chart && config.chart.colorscheme
  if (colorscheme) {
    if (colorscheme.type === 'monochrome') {
      backgroundColor = colorscheme.mainColor
    } else if (colorscheme.type === 'analogous') {
      backgroundColor = new Color(colorscheme.mainColor).analogousScheme().map(c => c.toCSS())
    } else if (colorscheme.type === 'manual') {
      backgroundColor = colorscheme.colors
    } else if (colorscheme.type === 'material') {
      backgroundColor = colors.material
    }
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

const chartOptions = {}
chartOptions.bar = (config, data) => {
  return {
    type: 'bar',
    data,
    options: {
      title: { display: true, text: metricLabel(config) },
      legend: { display: false },
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      }
    }
  }
}

chartOptions['stacked-bar'] = (config, data) => {
  return {
    type: 'bar',
    data,
    options: {
      title: { display: true, text: metricLabel(config) },
      tooltips: { mode: 'index', intersect: false },
      scales: {
        xAxes: [{
          stacked: true
        }],
        yAxes: [{
          stacked: true,
          ticks: {
            beginAtZero: true
          }
        }]
      }
    }
  }
}

chartOptions.pie = (config, data) => {
  return {
    type: 'pie',
    data,
    options: {
      title: { display: true, text: metricLabel(config) }
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
      title: { display: true, text: metricLabel(config) },
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      }
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
      title: { display: true, text: metricLabel(config) },
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      }
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
      title: { display: true, text: metricLabel(config) },
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      }
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
      title: { display: true, text: metricLabel(config) },
      tooltips: { mode: 'index', intersect: false },
      scales: {
        xAxes: [{
          stacked: true
        }],
        yAxes: [{
          stacked: true,
          ticks: {
            beginAtZero: true
          }
        }]
      }
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

function metricLabel(config) {
  const metricType = metricTypes.find(m => m.value === config.metricType)
  let label = metricType.value === 'count' ? metricType.text : metricType.text + ' de ' + config.valueField.label
  if (config.groupByField) label += ' par ' + config.groupByField.label
  if (config.chart.secondGroupByField) label += ' et par ' + config.chart.secondGroupByField.label
  return label
}

function prepareChart(config, data) {
  if (!chartOptions[config.chart.type]) new Error('Unsupported chart type ' + config.chart.type)
  return chartOptions[config.chart.type](config, prepareData(config, data))
}

export default { prepareChart, prepareData, metricLabel }
