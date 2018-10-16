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
        borderWidth: 1,
        backgroundColor
      }]
    }
  } else {
    const labels = []
    const datasets = []
    data.aggs.forEach((firstLevel, i) => {
      labels.push(firstLevel.value)
      firstLevel.aggs.forEach(secondLevel => {
        let dataset = datasets.find(d => d.key === secondLevel.value)
        if (!dataset) {
          dataset = {
            key: secondLevel.value,
            label: secondLevel.value,
            data: [],
            borderWidth: 1
          }
          datasets.push(dataset)
        }
        dataset.data[i] = config.metricType !== 'count' ? secondLevel.metric : secondLevel.total
      })
    })
    datasets.sort((a, b) => a.key < b.key ? -1 : 1)
    datasets.forEach((d, i) => {
      d.backgroundColor = Array.isArray(backgroundColor) ? backgroundColor[i] : backgroundColor
    })
    return { labels, datasets }
  }
}

const chartOptions = {}
chartOptions.bar = (config) => {
  return {
    type: 'bar',
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

chartOptions['stacked-bar'] = (config) => {
  return {
    type: 'bar',
    options: {
      title: { display: true, text: metricLabel(config) },
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

chartOptions.pie = (config) => {
  return {
    type: 'pie',
    options: {
      title: { display: true, text: metricLabel(config) }
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
  const c = chartOptions[config.chart.type](config)
  c.data = prepareData(config, data)
  return c
}

export default { prepareChart, prepareData, metricLabel }
