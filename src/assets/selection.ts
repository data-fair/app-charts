// Inter-app selection convention: a click on a chart entity emits a lone
// `_c_`/`_d_` key; a key targeting the x-axis field (the selection field
// declared here) is highlighted, never restricted. See the
// `data-fair-app` skill, `references/filters-url-convention.md` § « Sélection ».
//
// Pure helpers (no Vue), unit-tested.
import type { SelectionTarget, TargetFilter } from '@data-fair/lib-vue/selection.js'
import chroma from 'chroma-js'
import { parseSelectionValues } from '@data-fair/lib-vue/selection.js'

/** Selectable entity of a chart: the values of its x-axis field. */
export interface ChartSelectionTarget extends SelectionTarget {
  /** Dataset field holding the x-axis values. */
  fieldKey: string
  /** Standard vocabulary concept carried by this field, if any. */
  conceptId?: string
  datasetId: string
}

/**
 * Field whose values are used as x-axis (and thus as selectable entities),
 * or `null` when the x-axis is not a field value (columns as labels,
 * date buckets): nothing to select then.
 */
export function resolveSelectionTarget (
  chart: { config?: any } | null | undefined,
  dataset: { id?: string } | null | undefined,
  fields: Record<string, any> | null | undefined
): ChartSelectionTarget | null {
  const config = chart?.config
  const mode = (config?.type || '').replace('Categories', '')
  let field: any
  if (mode === 'rowsBased') field = config.labelsField
  // date groupBy: the label is an aggregated bucket, not the date of a row
  else if (mode === 'aggsBased' && config.groupBy?.type !== 'date') field = config.groupBy?.field

  const fieldKey = (typeof field === 'string' ? field : field?.key) as string | undefined
  const datasetId = dataset?.id
  if (!fieldKey || !datasetId) return null
  return { fieldKey, conceptId: fields?.[fieldKey]?.['x-concept']?.id, datasetId }
}

/**
 * Key of the selection filter: a single value (`eq`), concept form
 * (portable across datasets) when the field carries one, otherwise the
 * dataset-scoped form. A single key, as the convention requires.
 */
export function selectionFilterKey (target: ChartSelectionTarget): string {
  return target.conceptId
    ? `_c_${target.conceptId}_eq`
    : `_d_${target.datasetId}_${target.fieldKey}_eq`
}

/**
 * X-axis values designated by the target's filters, in URL order.
 * Only `eq`/`in` designate entities.
 */
export function selectionValues (filters: TargetFilter[]): string[] {
  const values: string[] = []
  for (const f of filters) {
    if (f.operator !== 'eq' && f.operator !== 'in') continue
    values.push(...(f.operator === 'in' ? parseSelectionValues(f.value) : [f.value]))
  }
  return values
}

/**
 * Single selection: a click replaces the current selection (even a multiple
 * selection received as `_in` — it is reduced to the clicked value); clicking again
 * the value that is already the only one selected → empty selection.
 */
export function nextSelectionValue (current: string[], value: string): string[] {
  return current.length === 1 && current[0] === value ? [] : [value]
}

const FADE_ALPHA = 0.25

function faded (color: unknown): unknown {
  if (typeof color !== 'string') return color
  try {
    const [r, g, b] = chroma(color).rgba()
    return `rgba(${r},${g},${b},${FADE_ALPHA})`
  } catch {
    return color
  }
}

/** Base color (string) of a dataset for element `i`, by order of preference. */
function firstColor (i: number, ...candidates: unknown[]): unknown {
  for (const c of candidates) {
    if (typeof c === 'string') return c
    if (Array.isArray(c) && typeof c[i] === 'string') return c[i]
  }
  return undefined
}

/**
 * Highlighting of a received selection: elements whose x-axis value
 * (`data.rawLabels`, aligned with `data.labels`) is not selected
 * are dimmed (alpha 0.25). No effect as long as no displayed element
 * is selected (selection targeting another column, or a value outside
 * the chart's top N). The transform is not mutated.
 *
 * `lineBased` (lines/radars) dims the points, the line keeps its color;
 * other charts are dimmed on the background (in a combo chart,
 * each dataset follows its own type).
 *
 * `vue-chartjs` updates datasets via `Object.assign` (it never removes
 * a key missing from the base dataset) and Chart.js caches the options
 * resolved per element as long as an option is scalar: a `backgroundColor`
 * going back from array to string is not re-evaluated (bars stay
 * dimmed). So we keep a **stable type** by always returning one array entry
 * per element, selected or not. Same for `pointBackgroundColor` of lines.
 */
export function applySelectionHighlight (data: any, selectedValues: string[], lineBased = false): any {
  const rawLabels = data?.rawLabels as (string | null)[] | null | undefined
  if (!rawLabels?.length) return data
  const selected = new Set(selectedValues || [])
  const isSelected = (i: number) => rawLabels[i] != null && selected.has(String(rawLabels[i]))
  const active = rawLabels.some((_, i) => isSelected(i))
  const style = (color: unknown, i: number) => (active && !isSelected(i) ? faded(color) : color)

  const datasets = data.datasets.map((dataset: any) => {
    // « Graphique mixte »: bar series stay dimmed on the
    // background, only lines get their points dimmed
    if (lineBased && dataset.type !== 'bar') {
      const base = rawLabels.map((_, i) => firstColor(i, dataset.pointBackgroundColor, dataset.borderColor, dataset.backgroundColor))
      return { ...dataset, pointBackgroundColor: base.map((color, i) => style(color, i)) }
    }
    if (Array.isArray(dataset.backgroundColor)) {
      return { ...dataset, backgroundColor: dataset.backgroundColor.map((c: unknown, i: number) => style(c, i)) }
    }
    if (typeof dataset.backgroundColor === 'string') {
      return { ...dataset, backgroundColor: rawLabels.map((_, i) => style(dataset.backgroundColor, i)) }
    }
    return dataset
  })
  return { ...data, datasets }
}
