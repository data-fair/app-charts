import type { DividerConfig } from '../../assets/utils'
import type { DatasetLine, ValuesLabelsItem } from '@/composables/useChartData'
import { getColors, getOrderedLabels, splitString, createValueLabeler, valueLabelsMap, getFieldLabel, compareLabels, extractDividerValue, hasUsableDivider, missingNumericLabels, comboSeriesStyle } from '../../assets/utils'

export interface RowsBasedContext {
  config: any
  chart: any
  fields: Record<string, any>
  finalizedAt: string | undefined
  baseParams: Record<string, string>
  getValue: (value: number | null | undefined, source?: unknown) => number | undefined
  // normalized divider (chart.config.divider) — row-by-row reading: raw column value
  divider: DividerConfig
  stacked: string | undefined
  // current value of theme.current ref (InternalThemeDefinition)
  theme: { colors: Record<string, string> }
  sortBy: string | undefined
  sortOrder: string | undefined
  // API responses
  results: DatasetLine[]
  categories: ValuesLabelsItem[] | null
}

export default function transformRowsBased (ctx: RowsBasedContext) {
  const { chart, fields, getValue, results: apiResults, config, theme, sortBy: rspSortBy, sortOrder: rspSortOrder, categories: apiCategories } = ctx

  const fill = chart.area || (chart.type === 'multi-line' && ctx.stacked === 'true')

  const valueLabel = createValueLabeler(config, chart.config.removeFromLabels)
  const customLabels = valueLabelsMap(config.valueLabels)

  // Don't mutate apiResults: copy before sorting
  const results = [...apiResults]

  const sortBy = rspSortBy || chart.config.rowSortBy
  const sortOrder = rspSortOrder || chart.config.sortOrder
  // Missing numeric x-axis values (e.g. a year without rows): synthetic
  // rows without value, hence no point and no zero on the line.
  const fillGaps = !!chart.config.fillMissingLabels && sortBy === 'label' && chart.type !== 'pie'
  if (fillGaps) {
    const labelsField = chart.config.labelsField!
    const missing = missingNumericLabels(results.map((r) => r[labelsField]))
    results.push(...missing.map((value) => ({ [labelsField]: value })))
  }
  if (sortBy === 'label') {
    const labelsField = chart.config.labelsField!
    results.sort((a, b) => {
      const labelA = valueLabel(a[labelsField], fields[labelsField])
      const labelB = valueLabel(b[labelsField], fields[labelsField])
      return sortOrder === 'desc' ? compareLabels(labelB, labelA) : compareLabels(labelA, labelB)
    })
  }

  // with filling, the added rows must not evict the real ones
  // (the `size` limit is already applied by the /lines call)
  const maxLabels = fillGaps ? results.length : chart.config.size
  const categories = apiCategories
  const labels = results.map((r) => valueLabel(r[chart.config.labelsField!], fields[chart.config.labelsField!])).slice(0, maxLabels)
  // raw x-axis values, aligned with `labels`: the selectable entities
  const rawLabels = results.slice(0, maxLabels).map((r) => r[chart.config.labelsField!] as string)
  let selectionValues: (string | null)[] = [...rawLabels]
  let datasets: any[]

  if (chart.config.color) {
    const color = chart.config.color.type === 'custom' ? chart.config.color.hexValue : theme.colors[chart.config.color.strValue!]
    datasets = [{
      borderColor: color,
      backgroundColor: color,
      data: results.map((r) => getValue(r[chart.config.valuesField!] as number, r)),
      pointStyle: chart.hidePoints ? false : 'circle',
      fill
    }]
  } else {
    const colors = getColors(categories?.map((c) => c.value) || (chart.config.valuesField && rawLabels) || chart.config.valuesFields || [], chart.config.colorOrder)

    if (chart.config.valuesField) {
      if (categories) {
        const categoryValues = categories.map((c) => c.value + '')
        const orderedValues = getOrderedLabels(categoryValues, chart.config.colorOrder)
        const sortedCategories = orderedValues.map((v) => categories.find((c) => (c.value + '') === v)!)
        datasets = sortedCategories.map(({ value, label }) => ({
          label: customLabels[String(value)] || label || valueLabel(value, fields[chart.config.categoriesField!]),
          borderColor: colors[value],
          backgroundColor: colors[value],
          pointStyle: chart.hidePoints ? false : 'circle',
          fill,
          data: results.map((r) => (r[chart.config.categoriesField!] === value && getValue(r[chart.config.valuesField!] as number, r)) || undefined)
        }))
      } else {
        const dataValues = results.slice(0, maxLabels).map((r) => getValue(r[chart.config.valuesField!] as number, r))

        const orderedRawLabels = getOrderedLabels(rawLabels, chart.config.colorOrder)
        const orderedLabels = orderedRawLabels.map((l) => valueLabel(l, fields[chart.config.labelsField!]))
        selectionValues = [...orderedRawLabels]
        const orderedData = orderedRawLabels.map((l) => {
          const index = rawLabels.indexOf(l)
          return dataValues[index]
        })

        if (chart.type === 'pie' && results.length > chart.config.size) {
          orderedRawLabels.push('Autre')
          orderedLabels.push('Autre')
          // the « Autre » slice is not a selectable entity
          selectionValues.push(null)
          // « Autre » slice: ratio of totals — a row without value or without
          // usable divider is excluded from the bucket (value hidden)
          const others = results.slice(chart.config.size).filter((r) =>
            r[chart.config.valuesField!] != null && hasUsableDivider(r, ctx.divider)
          )
          const otherSum = others.reduce((acc, r) => acc + (r[chart.config.valuesField!] as number), 0)
          const otherDiv = others.reduce((acc, r) => acc + (extractDividerValue(r, ctx.divider) ?? 0), 0)
          orderedData.push(getValue(otherSum, otherDiv))
        }

        datasets = [{
          labels: orderedLabels,
          borderColor: chart.type === 'pie' ? 'white' : orderedRawLabels.map((l) => colors[l]),
          backgroundColor: orderedRawLabels.map((l) => colors[l] || chart.config.colorOrder?.defaultColor || '#828282'),
          data: orderedData
        }]

        if (['percentages', 'both'].includes(chart.display as string)) {
          const sum = datasets[0].data.reduce((acc: number, d: number | undefined) => acc + (d || 0), 0)
          datasets[0].percentages = datasets[0].data.map((d: number | undefined) => d! * 100 / sum)
        }

        if (chart.type === 'pie') {
          labels.splice(0, labels.length, ...orderedLabels)
        }
      }
    } else {
      const valuesFields = getOrderedLabels(chart.config.valuesFields || [], chart.config.colorOrder)
      datasets = valuesFields.map((field) => ({
        label: getFieldLabel(field, fields, customLabels, chart.config.removeFromLabels),
        ...comboSeriesStyle(chart, field),
        borderColor: colors[field],
        backgroundColor: colors[field],
        pointStyle: chart.hidePoints ? false : 'circle',
        fill,
        data: results.map((r) => getValue(r[field] as number, r))
      }))
      if (chart.percentage) {
        for (const i in datasets[0].data as number[]) {
          const sum = datasets.reduce((acc: number, d) => acc + ((d.data as number[])[i] || 0), 0)
          if (sum) datasets.forEach((d) => { (d.data as number[])[i] *= 100 / sum })
        }
      }
    }
  }

  if (chart.type === 'paired-histogram') {
    datasets[0].data = (datasets[0].data as (number | undefined)[]).map((d) => -(d ?? 0))
  }

  // an x-axis value without data does not break the line: the stroke links the
  // points on either side
  if (fillGaps && ['line', 'multi-line'].includes(chart.type)) {
    datasets.forEach((d: any) => { d.spanGaps = true })
  }

  return {
    labels: labels.map((l) => splitString(config.labelsMaxWidth ?? 20, l + '')),
    datasets,
    rawLabels: selectionValues
  }
}
