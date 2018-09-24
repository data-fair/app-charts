// TODO: some palette generator ?
// this one ? https://www.npmjs.com/package/distinct-colors

// From data-fair response data to the data object expected by chartjs
function prepareData(config, data) {
  console.log('config', config)
  console.log('data', data)
  return {
    // labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
    labels: data.aggs.map(agg => agg.value),
    datasets: [{
      label: metricLabel(config),
      data: data.aggs.map(agg => config.metricType !== 'count' ? agg.metric : agg.total),
      borderWidth: 1
    }]
  }
}

const chartOptions = {}
chartOptions.bar = (config) => {
  return {
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true
        }
      }]
    }
  }
}

chartOptions.pie = (config) => {
  return {}
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
  return metricType.text + ' de ' + config.valueField.label
}

function prepareChart(config, data) {
  if (!chartOptions[config.chart.type]) new Error('Unsupported chart type ' + config.chart.type)
  return {
    type: config.chart.type,
    data: prepareData(config, data),
    options: chartOptions[config.chart.type](config)
  }
}

export default { prepareChart, metricLabel }
