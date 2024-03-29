import { setAlpha } from './colors.js'
import prepareData from './chart-data.js'

/**
 * @param {string | number} value
 * @param {number} maxLength
 * @returns {string}
 */
function formatValue (value, maxLength) {
  if (typeof value === 'number') return value.toLocaleString()
  const str = '' + value
  return str.length > maxLength ? str.slice(0, maxLength) + '...' : str
}

/**
 * @param {import('../config/.type/types.js').Config} config
 * @param {Record<any, any>} data
 * @returns {Record<string, any>}
 */
function getXAxis (config, data) {
  // @ts-ignore
  if (config.dataType?.groupBy && config.dataType.groupBy.type === 'date') {
    // @ts-ignore
    return { type: 'time', time: { unit: config.dataType.groupBy.interval } }
  } else {
    return {
      ticks: {
        callback (/** @type {number} */ value) {
          return formatValue(data.labels[value], 12)
        }
      }
    }
  }
}

/**
 * @param {Record<any, any>} data
 * @returns {Record<string, any>}
 */
function getYAxis (data) {
  return {
    ticks: {
      beginAtZero: true,
      callback (/** @type {number} */ value) {
        const label = data.datasets[value] && data.datasets[value].label ? data.datasets[value].label : value
        return formatValue(label, 12)
      }
    }
  }
}

/**
 * @param {Array<Record<string, any>>} tooltipItems
 * @param {Record<any, any>} data
 * @returns {string}
 */
function tooltipTitle (tooltipItems, data) {
  const value = tooltipItems[0].label || data.labels[tooltipItems[0].datasetIndex]
  // title might be truncated in tooltip, but not as much as in xAxis labels
  return formatValue(value, 50)
}

/**
 * @param {Record<string, any>} tooltipItem
 * @param {Record<any, any>} data
 * @returns {string}
 */
function tooltipLabel (tooltipItem, data) {
  const value = tooltipItem.raw || data.datasets[tooltipItem.datasetIndex].data[tooltipItem.dataIndex]
  let label
  if (tooltipItem.datasetIndex !== undefined) {
    label = data.datasets[tooltipItem.datasetIndex].label
  }
  if (label) return `${formatValue(label, 20)}: ${formatValue(value, 40)}`
  else return formatValue(value, 40)
}

/**
 * @param {Record<any, any>} data
 * @returns {{callbacks: {title: (tooltipItems: Array<Record<string, any>>) => string, label: (tooltipItem: Record<string, any>) => string}}}
 */
function getSingleTooltips (data) {
  return {
    callbacks: {
      title: (tooltipItems) => tooltipTitle(tooltipItems, data),
      label: (tooltipItem) => tooltipLabel(tooltipItem, data)
    }
  }
}

/**
 * @param {Record<any, any>} data
 * @returns {{mode: string, intersect: boolean, callbacks: {title: (tooltipItems: Array<Record<string, any>>) => string, label: (tooltipItem: Record<string, any>) => string}} | {callbacks: {title: (tooltipItems: Array<Record<string, any>>) => string, label: (tooltipItem: Record<string, any>) => string}}}
 */
function getStackedTooltips (data) {
  const customTooltips = {
    callbacks: {
      title: (/** @type {Array<Record<string, any>>} */ tooltipItems) => tooltipTitle(tooltipItems, data),
      label: (/** @type {Record<string, any>} */ tooltipItem) => tooltipLabel(tooltipItem, data)
    }
  }
  // when there are many items, better not to generate a huge tooltip
  if (data.datasets.length > 10) return customTooltips
  // otherwise an aggregated tooltip is handy
  return { mode: 'index', intersect: false, ...customTooltips }
}

const chartOptions = {}
chartOptions.bar = (/** @type {import('../config/.type/types.js').Config} */ config, /** @type {Record<any, any>} */ data) => {
  return {
    type: 'bar',
    data,
    options: {
      indexAxis: config.chartType?.horizontal ? 'y' : 'x',
      plugins: {
        title: { display: true, text: chartTitle(config) },
        legend: { display: true },
        tooltip: getSingleTooltips(data)
      },
      scales: {
        x: getXAxis(config, data),
        y: getYAxis(data)
      }
    }
  }
}

chartOptions['multi-bar'] = (/** @type {import('../config/.type/types.js').Config} */ config, /** @type {Record<any, any>} */ data) => {
  data.datasets.forEach(/** @param {Record<String, any>} dataset */ dataset => {
    dataset.borderColor = 'white'
    dataset.borderWidth = 1
  })
  return {
    type: 'bar',
    data,
    options: {
      indexAxis: config.chartType?.horizontal ? 'y' : 'x',
      plugins: {
        legend: { display: true, position: 'top' },
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
          ...getYAxis(data)
        }
      }
    }
  }
}

chartOptions['grouped-bar'] = (/** @type {import('../config/.type/types.js').Config} */ config, /** @type {Record<any, any>} */ data) => {
  data.datasets.forEach(/** @param {Record<String, any>} dataset */ dataset => {
    dataset.borderColor = setAlpha(dataset.backgroundColor, 0.5)
    dataset.borderWidth = 1
  })
  return {
    type: 'bar',
    data,
    options: {
      indexAxis: config.chartType?.horizontal ? 'y' : 'x',
      plugins: {
        title: { display: true, text: chartTitle(config) },
        tooltip: getSingleTooltips(data)
      },
      scales: {
        x: getXAxis(config, data),
        y: getYAxis(data)
      }
    }
  }
}

chartOptions.pie = (/** @type {import('../config/.type/types.js').Config} */ config, /** @type {Record<any, any>} */ data) => {
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

chartOptions['multi-pie'] = (/** @type {import('../config/.type/types.js').Config} */ config, /** @type {Record<any, any>} */ data) => {
  return {}
}

chartOptions.line = (/** @type {import('../config/.type/types.js').Config} */ config, /** @type {Record<any, any>} */ data) => {
  data.datasets.forEach(/** @param {Record<String, any>} dataset */ dataset => {
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
        y: getYAxis(data)
      }
    }
  }
}

chartOptions['multi-line'] = (/** @type {import('../config/.type/types.js').Config} */ config, /** @type {Record<any, any>} */ data) => {
  data.datasets.forEach(/** @param {Record<String, any>} dataset */ dataset => {
    dataset.fill = false
  })
  return {
    type: 'line',
    data,
    options: {
      plugins: {
        legend: { display: true },
        title: { display: true, text: chartTitle(config) },
        tooltip: getSingleTooltips(data)
      },
      scales: {
        x: getXAxis(config, data),
        y: getYAxis(data)
      }
    }
  }
}

chartOptions.area = (/** @type {import('../config/.type/types.js').Config} */ config, /** @type {Record<any, any>} */ data) => {
  data.datasets.forEach(/** @param {Record<String, any>} dataset */ dataset => {
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
        y: getYAxis(data)
      }
    }
  }
}

chartOptions['multi-area'] = (/** @type {import('../config/.type/types.js').Config} */ config, /** @type {Record<any, any>} */ data) => {
  data.datasets.forEach(/** @param {Record<String, any>} dataset */ dataset => {
    dataset.backgroundColor = setAlpha(dataset.backgroundColor, 0.5)
    dataset.fill = true
  })
  return {
    type: 'line',
    data,
    options: {
      plugins: {
        legend: { display: true },
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
          ...getYAxis(data)
        }
      }
    }
  }
}

chartOptions.radar = (/** @type {import('../config/.type/types.js').Config} */ config, /** @type {Record<any, any>} */ data) => {
  data.datasets.forEach(/** @param {Record<String, any>} dataset */ dataset => {
    dataset.fill = false
  })
  return {
    type: 'radar',
    data,
    options: {
      plugins: {
        legend: { display: true },
        title: { display: true, text: chartTitle(config) },
        tooltip: getSingleTooltips(data)
      }
    }
  }
}

chartOptions['multi-radar'] = (/** @type {import('../config/.type/types.js').Config} */ config, /** @type {Record<any, any>} */ data) => {
  data.datasets.forEach(/** @param {Record<String, any>} dataset */ dataset => {
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

/**
 * @param {import('../config/.type/types.js').Config} config
 * @returns {string}
 */
function chartTitle (config) {
  if (config.title) return config.title
  if (config.dataType?.type === 'linesBased') return ''
  // @ts-ignore
  if (config.dataType?.type === 'countBased') return 'Nombre de documents par ' + config.dataType?.groupBy?.field.label + (config.dataType?.secondGroupBy?.field ? ' et par ' + config.dataType.secondGroupBy.field.label : '')
  const metricType = metricTypes.find(m => m.value === config.dataType?.metricType)
  // @ts-ignore
  let label = metricType?.text + ' de ' + config.dataType?.valueField?.label
  // @ts-ignore
  if (config.dataType?.groupBy && config.dataType.groupBy.field) label += ' par ' + config.dataType.groupBy.field.label
  // @ts-ignore
  if (config.dataType?.secondGroupBy) label += ' et par ' + config.dataType.secondGroupBy.field.label
  return label
}

/**
 * @param {import('../config/.type/types.js').Config} config
 * @param {Record<any, any>} data
 * @returns {Record<string, any>}
 */
function prepareChart (config, data) {
  let renderType = config.chartType?.type
  // @ts-ignore
  if (config.dataType?.secondGroupBy && config.dataType.secondGroupBy.field && config.dataType.secondGroupBy.field.key) {
    // @ts-ignore
    if (renderType === 'bar' && config.chartType?.split) renderType = 'grouped-bar'
    else renderType = 'multi-' + renderType
  }
  // @ts-ignore
  if (!chartOptions[renderType]) throw new Error('Type de graphique non supporté ' + renderType)
  let ndata = data
  if (data.data) ndata = data.data
  // @ts-ignore
  const chart = chartOptions[renderType](config, prepareData(config, ndata))
  chart.options.responsive = false
  return chart
}

export default { prepareChart, prepareData, chartTitle }
