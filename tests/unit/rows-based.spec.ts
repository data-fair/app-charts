// Unit tests — rowsBased transform (pure API response -> Chart.js data)
import { test, expect } from '@playwright/test'
import transformRowsBased, { type RowsBasedContext } from '../../src/composables/chart-data/rowsBased'
import { extractDividerValue, type DividerConfig } from '../../src/assets/utils'

function baseCtx (overrides: Partial<RowsBasedContext> & { chart: any }): RowsBasedContext {
  return {
    config: {},
    fields: {},
    finalizedAt: undefined,
    baseParams: {},
    getValue: (v) => (v == null ? undefined : v),
    divider: { type: 'none' },
    stacked: undefined,
    theme: { colors: { primary: '#1976D2', secondary: '#424242', accent: '#82B1FF' } },
    sortBy: undefined,
    sortOrder: undefined,
    results: [],
    categories: null,
    ...overrides
  }
}

test('single valuesField maps rows to labels and data', () => {
  const ctx = baseCtx({
    chart: { type: 'line', config: { type: 'rowsBased', labelsField: 'dep', valuesField: 'count', size: 10 } },
    results: [
      { dep: '75', count: 10 },
      { dep: '77', count: 20 }
    ]
  })
  const data = transformRowsBased(ctx)
  expect(data.labels).toEqual([['75'], ['77']])
  expect(data.datasets).toHaveLength(1)
  expect(data.datasets[0].data).toEqual([10, 20])
})

test('labels are mapped through field x-labels when available', () => {
  const ctx = baseCtx({
    chart: { type: 'line', config: { type: 'rowsBased', labelsField: 'dep', valuesField: 'count', size: 10 } },
    fields: { dep: { 'x-labels': { 75: 'Paris' } } },
    results: [{ dep: '75', count: 3 }]
  })
  const data = transformRowsBased(ctx)
  expect(data.labels).toEqual([['Paris']])
})

test('getValue divides by config divider', () => {
  const ctx = baseCtx({
    chart: { type: 'line', config: { type: 'rowsBased', labelsField: 'dep', valuesField: 'count', size: 10 } },
    getValue: (v) => (v == null ? undefined : v / 10),
    results: [{ dep: '75', count: 1234 }]
  })
  const data = transformRowsBased(ctx)
  expect(data.datasets[0].data).toEqual([123.4])
})

test('pie buckets rows beyond size into an Autre label', () => {
  const ctx = baseCtx({
    chart: { type: 'pie', config: { type: 'rowsBased', labelsField: 'dep', valuesField: 'count', size: 2 } },
    results: [
      { dep: '75', count: 1 },
      { dep: '77', count: 2 },
      { dep: '78', count: 4 }
    ]
  })
  const data = transformRowsBased(ctx)
  expect(data.labels.map((l: string[]) => l[0])).toEqual(['75', '77', 'Autre'])
  expect(data.datasets[0].data).toEqual([1, 2, 4])
  expect(data.datasets[0].labels).toEqual(['75', '77', 'Autre'])
})

test('theme color is resolved to a single dataset', () => {
  const ctx = baseCtx({
    chart: {
      type: 'line',
      config: { type: 'rowsBased', labelsField: 'dep', valuesField: 'count', size: 10, color: { type: 'theme', strValue: 'primary' } }
    },
    results: [{ dep: '75', count: 1 }]
  })
  const data = transformRowsBased(ctx)
  expect(data.datasets[0].borderColor).toEqual('#1976D2')
})

test('paired-histogram flips the sign of the first dataset', () => {
  const ctx = baseCtx({
    chart: {
      type: 'paired-histogram',
      config: { type: 'rowsBased', labelsField: 'dep', valuesField: 'count', size: 10, color: { type: 'custom', hexValue: '#123456' } }
    },
    results: [{ dep: '75', count: 5 }]
  })
  const data = transformRowsBased(ctx)
  expect(data.datasets[0].data).toEqual([-5])
})

test('categories produce one dataset per category value', () => {
  const ctx = baseCtx({
    chart: {
      type: 'bar',
      config: { type: 'rowsBasedCategories', labelsField: 'dep', valuesField: 'count', categoriesField: 'type', size: 10 }
    },
    results: [
      { dep: '75', type: 'A', count: 1 },
      { dep: '75', type: 'B', count: 2 },
      { dep: '77', type: 'A', count: 3 }
    ],
    categories: [
      { value: 'A', label: 'Catégorie A' },
      { value: 'B', label: 'Catégorie B' }
    ]
  })
  const data = transformRowsBased(ctx)
  expect(data.datasets).toHaveLength(2)
  expect(data.datasets[0].label).toEqual('Catégorie A')
  expect(data.datasets[0].data).toEqual([1, undefined, 3])
  expect(data.datasets[1].label).toEqual('Catégorie B')
  expect(data.datasets[1].data).toEqual([undefined, 2, undefined])
})

test('sortBy label orders results through localized comparison', () => {
  const ctx = baseCtx({
    chart: { type: 'line', config: { type: 'rowsBased', labelsField: 'dep', valuesField: 'count', size: 10 } },
    sortBy: 'label',
    sortOrder: 'desc',
    results: [
      { dep: '75', count: 1 },
      { dep: '77', count: 2 }
    ]
  })
  const data = transformRowsBased(ctx)
  expect(data.labels).toEqual([['77'], ['75']])
})

// ── Diviseur « colonne » (valeur brute de la ligne) ──────────────────────────

function dividerGetValue (divider: DividerConfig) {
  return (v: number | null | undefined, source?: unknown) => {
    if (v == null) return undefined
    const d = extractDividerValue(source, divider)
    if (d === undefined || d === 0) return undefined
    return v / d
  }
}

test('column divider divides each row by its own raw column value and hides missing divisors', () => {
  const divider = { type: 'column', field: 'pop', metric: 'sum' } as const
  const ctx = baseCtx({
    chart: { type: 'bar', config: { type: 'rowsBased', labelsField: 'dep', valuesField: 'count', size: 10 } },
    divider,
    getValue: dividerGetValue(divider),
    results: [
      { dep: '75', count: 100, pop: 2 },
      { dep: '77', count: 30, pop: 3 },
      { dep: '78', count: 50 }, // pas de diviseur exploitable → valeur masquée
      { dep: '79', count: 40, pop: 0 } // diviseur nul → valeur masquée
    ]
  })
  const data = transformRowsBased(ctx)
  expect(data.datasets[0].data).toEqual([50, 10, undefined, undefined])
})

test('pie Autre bucket divides the ratio of totals when a column divider is set', () => {
  const divider = { type: 'column', field: 'pop', metric: 'sum' } as const
  const ctx = baseCtx({
    chart: { type: 'pie', display: 'values', config: { type: 'rowsBased', labelsField: 'dep', valuesField: 'count', size: 2 } },
    divider,
    getValue: dividerGetValue(divider),
    results: [
      { dep: '75', count: 100, pop: 2 },
      { dep: '77', count: 30, pop: 3 },
      { dep: '78', count: 90, pop: 9 },
      { dep: '79', count: 10, pop: 1 }
    ]
  })
  const data = transformRowsBased(ctx)
  // parts : 75 → 100/2 = 50 ; 77 → 30/3 = 10 ; Autre → (90+10)/(9+1) = 10
  expect(data.datasets[0].data).toEqual([50, 10, 10])
})
