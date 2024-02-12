import getColors from '@data-fair/lib/color-scheme/colors.js'

/**
 * From data-fair response data to the data object expected by chartjs
 * @param {import('../config/.type/types.js').Config} config
 * @param {Record<any, any>} data
 * @returns {{labels: Array<string>, datasets: Array<{data: Array<string>, backgroundColor: string | string[], borderColor: string | string[]}>}}
 */
export default function prepareData(config, data) {
  if (config.dataType?.type === 'linesBased') return prepareLinesData(config, data)
  else return prepareAggData(config, data)
}

/**
 * @param {import('../config/.type/types.js').Config} config
 * @param {Record<any, any>} data
 * @returns {{labels: Array<string>, datasets: Array<{data: Array<string>, key: string, label: string, backgroundColor: string, borderColor: string}>}}
 * @throws {Error}
 */
function prepareLinesData(config, data) {
  // @ts-ignore
  if (config.chartType?.type === 'pie' && config.dataType?.valuesFields?.length > 1) {
    throw new Error('La visualisation camembert ne supporte pas d\'afficher plusieurs niveaux.')
  }
  const vuetifyColors = config.vuetifyColors || null
  const colors = config.chartType?.type === 'pie'
    // @ts-ignore
    ? [getColors(config.colorscheme, data, data.results.length, vuetifyColors)]
    // @ts-ignore
    : getColors(config.colorscheme, data, config.dataType?.valuesFields?.length, vuetifyColors)

  return {
    // @ts-ignore
    labels: data.results.map(/** @param {Array<string>} r */ r => r[config.dataType?.labelsField?.key]),
    // @ts-ignore
    datasets: config.dataType?.valuesFields?.map((/** @type {Record<string, any>} */ f, /** @type {number} */ i) => {
      const backgroundColor = colors[i]
      return {
        data: data.results.map(/** @param {Array<string>} r */ r => r[f.key]),
        key: f.key,
        label: f.label,
        backgroundColor,
        borderColor: backgroundColor
      }
    })
  }
}

/**
 * @param {import('../config/.type/types.js').Config} config
 * @param {Record<any, any>} data
 * @returns {{labels: Array<string>, datasets: Array<{data: Array<string>, key: string, label: string, backgroundColor: string, borderColor: string}>}}
 * @throws {Error}
 */
function prepare2levelAggData(config, data) {
  if (config.chartType?.type === 'pie') {
    throw new Error('La visualisation camembert ne supporte pas d\'afficher plusieurs niveaux.')
  }

  const /** @type {Array<any>} */ labels = []
  const /** @type {Array<any>} */ datasets = []
  const totalDataset = { label: 'Total', data: [] }
  const vuetifyColors = config.vuetifyColors || null
  data.aggs.forEach((/** @type {Record<string, any>} */ firstLevel, /** @type {number} */ i) => {
    labels.push(firstLevel.value)
    // @ts-ignore
    totalDataset.data.push(config.dataType?.type !== 'countBased' ? firstLevel.metric : firstLevel.total)
    firstLevel.aggs.forEach(/** @param {Record<string, any>} secondLevel */ secondLevel => {
      let dataset = datasets.find(d => d.key === secondLevel.value)
      if (!dataset) {
        dataset = {
          key: secondLevel.value,
          label: secondLevel.value,
          data: []
        }
        datasets.push(dataset)
      }
      if (config.dataType?.type === 'countBased') {
        dataset.data[i] = secondLevel.total
      } else {
        dataset.data[i] = secondLevel.metric
      }
      dataset.totalSort = (dataset.totalCount || 0) + dataset.data[i]
    })
  })
  if (datasets.length > 60) throw new Error(`Le graphique essaie d'afficher un nombre trop important de séries (${datasets.length})`)
  const sort = config.dataType?.secondSort || (config.dataType?.type === 'countBased' ? '-count' : '-metric')
  if (sort === '-count' || sort === '-metric') datasets.sort((a, b) => a.totalSort < b.totalSort ? 1 : -1)
  if (sort === 'metric') datasets.sort((a, b) => a.totalSort < b.totalSort ? 1 : -1)
  else if (sort === 'key') datasets.sort((a, b) => a.key < b.key ? -1 : 1)
  else if (sort === '-key') datasets.sort((a, b) => a.key < b.key ? 1 : -1)
  if (config.chartType?.showTotal) datasets.push(totalDataset)
  // @ts-ignore
  const colors = getColors(config.colorscheme, data, datasets.length, vuetifyColors)
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
  return { labels, datasets }
}

/**
 * @param {import('../config/.type/types.js').Config} config
 * @param {Record<any, any>} data
 * @returns {{labels: Array<string>, datasets: Array<{data: Array<string>, backgroundColor: string | string[], borderColor: string | string[]}>}}
 * @throws {Error}
 */
function prepareAggData(config, data) {
  if (data.aggs.length > 1000) {
    throw new Error('Nombre d\'éléments à afficher trop important. Abandon.')
  }
  // @ts-ignore
  if (config.dataType?.secondGroupBy && config.dataType.secondGroupBy.field && config.dataType.secondGroupBy.field.key) {
    return prepare2levelAggData(config, data)
  } else {
    const vuetifyColors = config.vuetifyColors || null
    // @ts-ignore
    const backgroundColor = config.chartType?.type === 'pie' ? getColors(config.colorscheme, data, data.aggs.length, vuetifyColors) : getColors(config.colorscheme, data, 1, vuetifyColors)[0]
    return {
      labels: data.aggs.map(/** @param {Record<String, any>} agg */ agg => agg.value),
      datasets: [{
        data: data.aggs.map(/** @param {Record<String, any>} agg */ agg => config.dataType?.type !== 'countBased' ? agg.metric : agg.total),
        backgroundColor,
        borderColor: backgroundColor
      }]
    }
  }
}
