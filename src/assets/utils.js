/**
 * @typedef {import('./config/.type/types.js').Config['chart']['config']} ChartConfig
 */

import chroma from 'chroma-js'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import useAppInfo from '@/composables/useAppInfo'
const { chart } = useAppInfo()

/**
 * @param {ChartConfig} config
 * @returns {string}
 */
export function getSortStr (config) {
  const sortOrder = reactiveSearchParams['sort-order'] || config.sortOrder
  const sortBy = reactiveSearchParams['sort-by'] || config.sortBy
  let str = (sortOrder === 'desc' ? '-' : '')
  if (sortBy === 'value') str += (config.valuesField || config.valuesFields?.[0]?.key || config.valueCalc?.type || (config.metric && 'metric'))
  else if (sortBy === 'label') str += (config.labelsField ? config.labelsField.key : (config.groupBy && config.groupBy.field.key))
  else if (sortBy === 'row') str += '_i'
  return str
}

/**
 * @param {string[]} labels
 * @returns {Object.<string, string>}
 */
export function getColors (labels) {
  if (chart.config.colors.type === 'palette') {
    /** @type {Object.<string, string>} */
    const colors = {}
    const numColors = 12 // Math.min(12, labels.length + chart.config.colors.offset)
    const palette = chroma.scale(chart.config.colors.name).mode('lch').colors(numColors)
    labels.forEach((label, i) => {
      colors[label] = palette[i + chart.config.colors.offset % 12]
    })
    return colors
  } else return Object.assign({}, ...chart.config.colors.styles.map(s => ({ [s.value != null ? s.value : s.label]: s.color })))
}

// taken from https://stackoverflow.com/questions/64254355/cut-string-into-chunks-without-breaking-words-based-on-max-length
export function splitString (n, str) {
  const arr = str?.split(' ')
  const result = []
  let subStr = arr[0]
  for (let i = 1; i < arr.length; i++) {
    const word = arr[i]
    if (subStr.length + word.length + 1 <= n) {
      subStr = subStr + ' ' + word
    } else {
      result.push(subStr)
      subStr = word
    }
  }
  if (subStr.length) { result.push(subStr) }
  return result
}
