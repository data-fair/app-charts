import chroma from 'chroma-js'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import dayjs from 'dayjs'
import type { AnyChartConfig } from '@/types'
import type { Filter } from '@data-fair/lib-utils/filters'

export function formatDateLabel (value: string, interval: string): string {
  const d = dayjs(value)
  if (!d.isValid()) return value
  switch (interval) {
    case 'year': return d.format('YYYY')
    case 'month': return d.format('MMM YYYY')
    case 'day': return d.format('DD/MM/YYYY')
    case 'week': return d.format('DD/MM/YYYY')
    case 'quarter': return `T${Math.floor(d.month() / 3) + 1} ${d.format('YYYY')}`
    default: return value
  }
}

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

export function getOrderedLabels (labels: string[], colorOrder: AnyChartConfig['colorOrder']): string[] {
  if (!colorOrder) return labels
  if (colorOrder.type === 'palette' && colorOrder.seriesOrder?.length) {
    const ordered = colorOrder.seriesOrder.filter((item: string) => labels.includes(item))
    ordered.push(...labels.filter((label: string) => !ordered.includes(label)))
    return ordered
  }
  if (colorOrder.type === 'manual' && colorOrder.entries?.length) {
    const ordered = colorOrder.entries.map((s: { key: string }) => s.key).filter((k: string) => labels.includes(k))
    ordered.push(...labels.filter((label: string) => !ordered.includes(label)))
    return ordered
  }
  return labels
}

export function getColors (labels: string[], colorOrder: AnyChartConfig['colorOrder']) {
  if (colorOrder?.type === 'palette') {
    const colors: Record<string, string> = {}
    const numColors = 12
    const palette = chroma.scale(colorOrder.name).mode('lch').colors(numColors)
    labels.forEach((label, i) => {
      colors[label] = palette[(i + (colorOrder.offset ?? 0)) % numColors]
    })
    return colors
  } else {
    return Object.assign({}, ...(colorOrder?.entries?.map((s: { key: string; color?: string }) => ({ [s.key]: s.color })) || []))
  }
}

export function normalizeFilters (filters: Filter[]) {
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
