import type { AnyChartConfig } from '@/types'
import type { Filter } from '@data-fair/lib-utils/filters/index.js'
import type { AggItem } from '@/composables/useChartData'
import chroma from 'chroma-js'
import dayjs from 'dayjs'
import { filters2params } from '@data-fair/lib-utils/filters/index.js'

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

// ──────────────────────────────────────────────────────────────────
// Label overrides (config.valueLabels) — pure helpers
// ──────────────────────────────────────────────────────────────────

/** Legacy boolean format (config.booleanLabels), kept as a fallback for existing configs */
export interface BooleanLabels {
  trueLabel?: string
  falseLabel?: string
  /** Also replace the « 0 » and « 1 » labels (numeric columns used as booleans) */
  numericBooleans?: boolean
}

/** Label override: `value` is a raw column value or a column key */
export interface ValueLabel {
  value: string | number
  label: string
}

/** Value -> label lookup table (entries without value or label are ignored) */
export function valueLabelsMap (valueLabels?: ValueLabel[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const entry of valueLabels || []) {
    if (entry?.value === undefined || entry?.value === null || entry.value === '' || !entry.label) continue
    map[String(entry.value)] = entry.label
  }
  return map
}

/**
 * Removes `removeFromLabels` from a displayed label (first occurrence) and cleans
 * leftover spaces: the dataset value may contain one more space
 * than the text typed in the form.
 */
export function stripLabel (label: string, removeFromLabels?: string): string {
  return removeFromLabels ? label.replace(removeFromLabels, '').trim() : label
}

/**
 * Displayed label for a raw column value:
 * 1. `valueLabels` override from the chart config (never altered by `removeFromLabels`)
 * 2. `x-labels` mapping from the dataset schema (historical behavior)
 * 3. boolean labels from the legacy `booleanLabels` config (true/false, and 0/1 if numericBooleans)
 * 4. raw value as is
 * `removeFromLabels` is then removed in cases 2 to 4.
 */
export function getValueLabel (raw: unknown, field: any, booleanLabels?: BooleanLabels, customLabels?: Record<string, string>, removeFromLabels?: string): string {
  const override = customLabels?.[String(raw)]
  if (override) return override
  const strip = (label: string) => stripLabel(label, removeFromLabels)
  const xLabel = field?.['x-labels']?.[raw as string]
  if (xLabel) return strip(xLabel)
  if (booleanLabels) {
    if (raw === true || raw === 'true') return strip(booleanLabels.trueLabel || String(raw))
    if (raw === false || raw === 'false') return strip(booleanLabels.falseLabel || String(raw))
    if (booleanLabels.numericBooleans) {
      if (raw === 1 || raw === '1') return strip(booleanLabels.trueLabel || String(raw))
      if (raw === 0 || raw === '0') return strip(booleanLabels.falseLabel || String(raw))
    }
  }
  return strip(String(raw))
}

/** Label resolver of a chart: `valueLabels`, then x-labels, then legacy boolean fallback */
export function createValueLabeler (config?: { valueLabels?: ValueLabel[]; booleanLabels?: BooleanLabels }, removeFromLabels?: string) {
  const customLabels = valueLabelsMap(config?.valueLabels)
  return (raw: unknown, field?: any) => getValueLabel(raw, field, config?.booleanLabels, customLabels, removeFromLabels)
}

/**
 * Label of an axis or series defined by a column: `valueLabels` override
 * (key = column key), otherwise the field label, then `removeFromLabels` removed.
 */
export function getFieldLabel (key: string, fields: Record<string, any>, customLabels?: Record<string, string>, removeFromLabels?: string): string {
  if (customLabels?.[key]) return customLabels[key]
  const label = (fields[key]?.label || fields[key]?.title || fields[key]?.['x-originalName'] || key) as string
  return stripLabel(label, removeFromLabels)
}

/**
 * Label comparison for the « by label » sort: when both
 * labels are numeric (interval ranges, exact values of a
 * numeric column), compare the numeric values; otherwise natural
 * locale collation (numbers included in a string).
 */
export function compareLabels (labelA: string, labelB: string): number {
  const numA = labelA.trim() === '' ? Number.NaN : Number(labelA)
  const numB = labelB.trim() === '' ? Number.NaN : Number(labelB)
  if (Number.isFinite(numA) && Number.isFinite(numB)) return numA - numB
  return labelA.localeCompare(labelB, 'fr', { numeric: true })
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

/**
 * Static filters serialized as REST parameters (`_in`, `_gte`...), for the
 * `getItems` URLs of the config-schema (value lists and contextual cardinality).
 */
export function staticFiltersParams (filters?: Filter[]): string {
  return new URLSearchParams(filters2params(normalizeFilters(filters as Filter[]) as Filter[])).toString()
}

// ──────────────────────────────────────────────────────────────────
// Divider (chart.config.divider) — pure helpers, unit-tested
// ──────────────────────────────────────────────────────────────────

export interface DividerConfig {
  type: 'none' | 'column' | 'groupCount' | 'totalCount'
  /** Dataset column holding the division values (type "column") */
  field?: string
  /** Aggregate applied to the column for each group (type "column") */
  metric?: string
}

/**
 * Normalizes the divider configuration of a chart.
 * Any unexpected format (missing, incomplete, legacy global number handled by the
 * multiplier) is interpreted as « no divider ». Leftover properties
 * from a former form branch are ignored.
 */
export function normalizeDivider (raw: unknown): DividerConfig {
  if (!raw || typeof raw !== 'object') return { type: 'none' }
  const r = raw as { type?: unknown; field?: unknown; metric?: unknown }
  if (r.type === 'column' && typeof r.field === 'string' && r.field) {
    return { type: 'column', field: r.field, metric: typeof r.metric === 'string' && r.metric ? r.metric : 'sum' }
  }
  if (r.type === 'groupCount' || r.type === 'totalCount') return { type: r.type }
  return { type: 'none' }
}

/**
 * Extracts the division value from a source:
 * - aggregate item (/values_agg): additional metric `<field>_<metric>`
 *   for a column, number of rows in the group (`total`) for a groupCount
 * - dataset row (/lines): raw property `<field>`
 * - already aggregated number (global /metric_agg or totalCount of /lines):
 *   used directly
 */
export function extractDividerValue (source: unknown, divider: DividerConfig): number | undefined {
  if (divider.type === 'none') return undefined
  if (typeof source === 'number') return Number.isFinite(source) ? source : undefined
  if (!source || typeof source !== 'object') return undefined
  const s = source as Record<string, unknown>
  let raw: unknown
  if (divider.type === 'groupCount') {
    raw = s.total
  } else if (divider.type === 'column') {
    raw = s[`${divider.field}_${divider.metric}`] ?? s[divider.field!]
  } else {
    return undefined
  }
  const value = typeof raw === 'string' ? Number(raw) : raw
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/**
 * A source is « divisible » when the divider is not read source by
 * source (totalCount: global value, handled in getValue) or when it carries
 * a usable value (numeric, non-zero). Otherwise the
 * chart value is hidden.
 */
export function hasUsableDivider (source: unknown, divider: DividerConfig): boolean {
  if (divider.type === 'none' || divider.type === 'totalCount') return true
  const d = extractDividerValue(source, divider)
  return d !== undefined && d !== 0
}

/**
 * Value to apply to the `stacked` URL parameter to reflect the config.
 * - toggle disabled (`disableDynamicStack`): the config rules, a
 *   leftover parameter (shared URL, previous session) is corrected/removed;
 * - toggle visible: an existing choice (URL/user) is kept, otherwise
 *   the config default applies.
 * `undefined` means « remove the parameter ».
 */
export function stackedParam (stacked: boolean | undefined, disabled: boolean | undefined, current: string | undefined): string | undefined {
  if (disabled) return stacked ? 'true' : undefined
  if (stacked) return current || 'true'
  return undefined
}

/**
 * Display of a value label on a bar (chartjs-plugin-datalabels):
 * - false for a missing or zero value: no empty template, which
 *   would disturb the overlap detection of the other labels
 * - 'auto' otherwise: the plugin hides the label if it overlaps another one
 *   (small stacked segments, thin bars), the value stays in the tooltip
 */
export function chartValueLabelDisplay (value: unknown): false | 'auto' {
  return value === null || value === undefined || value === 0 ? false : 'auto'
}

/** Dash patterns shared by the global options and the series of the « Graphique mixte » type. */
export const LINE_DASH_PATTERNS: Record<string, number[]> = {
  dashed: [6, 6],
  dotted: [2, 3]
}

/**
 * Plot type, dash pattern and axis of a series of the « Graphique
 * mixte » chart: the columns of `axes.right.fields` on the right axis, all the
 * others on the left axis (default: bars on the left, lines on the right).
 * Empty for other types: Chart.js then keeps the base type and the `y` axis.
 */
export function comboSeriesStyle (chart: any, field: string): Record<string, unknown> {
  if (chart.type !== 'combo') return {}
  const right = chart.axes?.right
  const isRight = (right?.fields || []).includes(field)
  const group = (isRight ? right : chart.axes?.left) || {}
  const type = group.type || (isRight ? 'line' : 'bar')
  const dash = type === 'line' && LINE_DASH_PATTERNS[group.lineDash as string]
  return {
    type,
    yAxisID: isRight ? 'y1' : 'y',
    ...(dash ? { borderDash: dash } : {})
  }
}

/**
 * Color of a target: dedicated palette with strong hue and
 * lightness contrast (red, blue, purple), stable from one chart to another. Deliberately
 * independent of the theme's semantic colors (error/warning are two close
 * orange-reds) and of the series palettes.
 */
export function objectifColor (index: number): string {
  const colors = ['#E53935', '#1E88E5', '#8E24AA']
  return colors[index % colors.length]
}

/**
 * Shape of the legend marker: a stroke for an unfilled line (dashes
 * stay readable), a filled rectangle for an area or bars.
 */
export function legendPointStyle (dataset: { fill?: boolean } | undefined, metaType: string | undefined): 'line' | 'rect' {
  return metaType === 'line' && !dataset?.fill ? 'line' : 'rect'
}

/** Is a series attached to the right axis? Only the `combo` type allows it. */
function hasRightSeries (chart: any): boolean {
  return !!chart?.axes?.right?.fields?.length
}

export const CARTESIAN_TYPES = ['line', 'bar', 'multi-line', 'multi-bar', 'combo', 'paired-histogram']

/** The right axis is only needed with a series that uses it. */
export function needsSecondaryAxis (chart: any): boolean {
  return hasRightSeries(chart)
}

// taken from https://stackoverflow.com/questions/64254355/cut-string-into-chunks-without-breaking-words-based-on-max-length
export function splitString (n: number, str: string) {
  const arr = str?.split(' ') ?? []
  const result: string[] = []
  let subStr = arr[0] ?? ''
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

export function fillMissingDateAggs (aggs: AggItem[], interval: string, sortOrder?: string): AggItem[] {
  if (!aggs.length) return aggs
  const dates = aggs.map(a => dayjs(a.value as string)).filter(d => d.isValid())
  if (!dates.length) return aggs

  let min = dates[0]
  let max = dates[0]
  for (const d of dates) {
    if (d.isBefore(min)) min = d
    if (d.isAfter(max)) max = d
  }

  const existing = new Map<string, AggItem>()
  for (const a of aggs) {
    existing.set(dayjs(a.value as string).format('YYYY-MM-DD'), a)
  }

  const result: AggItem[] = []
  let current = min.clone().startOf(interval as any)
  const end = max.clone().startOf(interval as any)

  while (!current.isAfter(end)) {
    const key = current.format('YYYY-MM-DD')
    const existingAgg = existing.get(key)
    if (existingAgg) {
      result.push(existingAgg)
    } else {
      result.push({
        value: key,
        total: undefined,
        metric: undefined,
        aggs: []
      })
    }
    current = current.add(1, interval as any)
  }

  if (sortOrder === 'desc') {
    result.reverse()
  }

  return result
}

/**
 * Missing intermediate values between numeric axis labels (e.g. a
 * year without rows). The step is the smallest observed gap: with a single gap
 * (two labels) there is nothing to infer. Returns [] as soon as a label is not
 * numeric or the filling would exceed `max`.
 */
export function missingNumericLabels (values: unknown[], max = 500): number[] {
  const nums = values.map(v => typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : Number.NaN)
  if (!nums.length || !nums.every(Number.isFinite)) return []
  const sorted = [...new Set(nums)].sort((a, b) => a - b)
  if (sorted.length < 2) return []
  let step = Infinity
  for (let i = 1; i < sorted.length; i++) step = Math.min(step, sorted[i] - sorted[i - 1])
  const missing: number[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    for (let v = sorted[i] + step; v < sorted[i + 1]; v += step) {
      missing.push(v)
      if (missing.length > max) return []
    }
  }
  return missing
}
