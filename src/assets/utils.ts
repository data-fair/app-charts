import chroma from 'chroma-js'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import type { AnyChartConfig } from '@/types'

export function getSortStr (config: AnyChartConfig) {
  const sortOrder = reactiveSearchParams['sort-order'] || config?.sortOrder
  const sortBy = reactiveSearchParams['sort-by'] || config?.sortBy
  let str = (sortOrder === 'desc' ? '-' : '')
  if (sortBy === 'value') {
    if (config?.valuesField || config?.valuesFields?.[0]) {
      str += (config?.valuesField || config?.valuesFields?.[0])
    } else {
      str += (config?.valueCalc?.type || 'metric')
    }
  }
  else if (sortBy === 'label') str += (config?.labelsField || (config?.groupBy && config?.groupBy.field))
  else if (sortBy === 'row') str += '_i'
  return str
}

export function getColors (labels: string[], colorsConfig: AnyChartConfig['colors']) {
  if (colorsConfig?.type === 'palette') {
    const colors: Record<string, string> = {}
    const numColors = 12 // Math.min(12, labels.length + chart.config.colors.offset)
    const palette = chroma.scale(colorsConfig.name).mode('lch').colors(numColors)
    labels.forEach((label, i) => {
      colors[label] = palette[i + (colorsConfig.offset ?? 0) % 12]
    })
    return colors
  } else {
    return Object.assign({}, ...(colorsConfig?.styles?.map((s: any) => ({ [s.value || s.key]: s.color })) || []))
  }
}

export function normalizeFilters (filters: any[]) {
  return filters?.map(f => {
    if (!f) return f
    if (typeof f.field === 'string') {
      return { ...f, field: { key: f.field } }
    }
    return f
  })
}

// taken from https://stackoverflow.com/questions/64254355/cut-string-into-chunks-without-breaking-words-based-on-max-length
export function splitString (n: number, str: string) {
  const arr = str?.split(' ')
  const result: string[] = []
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
