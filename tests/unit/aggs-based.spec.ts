// Unit tests — aggsBased transform (pure API response -> Chart.js data)
import dayjs from 'dayjs'
import 'dayjs/locale/fr.js'
import { test, expect } from '@playwright/test'
import transformAggsBased, { type AggsBasedContext } from '../../src/composables/chart-data/aggsBased'

// formatDateLabel formate via dayjs global : aligner la locale sur le comportement
// de l'app (createLocaleDayjs(session.lang) en fr)
dayjs.locale('fr')

function baseCtx (overrides: Partial<AggsBasedContext> & { chart: any }): AggsBasedContext {
  return {
    config: {},
    fields: {},
    finalizedAt: undefined,
    baseParams: {},
    getValue: (v) => (v == null ? undefined : v),
    stacked: undefined,
    metric: undefined,
    theme: { colors: { primary: '#1976D2' } },
    sortBy: undefined,
    sortOrder: undefined,
    aggs: [],
    ...overrides
  }
}

test('total aggregation maps agg values to labels and data', () => {
  const ctx = baseCtx({
    chart: { type: 'bar', config: { type: 'aggsBased', groupBy: { type: 'value', field: 'region' }, size: 10 } },
    aggs: [
      { value: 'A', total: 5 },
      { value: 'B', total: 7 }
    ]
  })
  const data = transformAggsBased(ctx)
  expect(data.labels).toEqual([['A'], ['B']])
  expect(data.datasets[0].data).toEqual([5, 7])
})

test('valueCalc of type metric reads a.metric instead of a.total', () => {
  const ctx = baseCtx({
    chart: {
      type: 'line',
      config: { type: 'aggsBased', groupBy: { type: 'value', field: 'region' }, size: 10, valueCalc: { type: 'metric', field: 'surface', metric: 'avg' } }
    },
    aggs: [
      { value: 'A', total: 100, metric: 12.5 },
      { value: 'B', total: 200, metric: 30 }
    ]
  })
  const data = transformAggsBased(ctx)
  expect(data.datasets[0].data).toEqual([12.5, 30])
})

test('groupsField produces one dataset per sub-aggregation value', () => {
  const ctx = baseCtx({
    chart: { type: 'multi-bar', config: { type: 'aggsBased', groupBy: { type: 'value', field: 'region' }, groupsField: 'type', size: 10 } },
    aggs: [
      { value: 'A', total: 6, aggs: [{ value: 'H', total: 4 }, { value: 'F', total: 2 }] },
      { value: 'B', total: 6, aggs: [{ value: 'H', total: 1 }, { value: 'F', total: 5 }] }
    ]
  })
  const data = transformAggsBased(ctx)
  expect(data.datasets.map((d: any) => d.label)).toEqual(['H', 'F'])
  expect(data.datasets[0].data).toEqual([4, 1])
  expect(data.datasets[1].data).toEqual([2, 5])
})

test('missing group values produce undefined data points', () => {
  const ctx = baseCtx({
    chart: { type: 'multi-bar', config: { type: 'aggsBased', groupBy: { type: 'value', field: 'region' }, groupsField: 'type', size: 10 } },
    aggs: [
      { value: 'A', total: 4, aggs: [{ value: 'H', total: 4 }] },
      { value: 'B', total: 5, aggs: [{ value: 'F', total: 5 }] }
    ]
  })
  const data = transformAggsBased(ctx)
  expect(data.datasets[0].data).toEqual([4, undefined])
  expect(data.datasets[1].data).toEqual([undefined, 5])
})

test('pie buckets aggs beyond size into an Autre label', () => {
  const ctx = baseCtx({
    chart: { type: 'pie', config: { type: 'aggsBased', groupBy: { type: 'value', field: 'region' }, size: 2 } },
    aggs: [
      { value: 'A', total: 1 },
      { value: 'B', total: 2 },
      { value: 'C', total: 4 }
    ]
  })
  const data = transformAggsBased(ctx)
  expect(data.labels.map((l: string[]) => l[0])).toEqual(['A', 'B', 'Autre'])
  expect(data.datasets[0].data).toEqual([1, 2, 4])
})

test('display percentages computes the share of each value', () => {
  const ctx = baseCtx({
    chart: { type: 'bar', display: 'percentages', config: { type: 'aggsBased', groupBy: { type: 'value', field: 'region' }, size: 10 } },
    aggs: [
      { value: 'A', total: 1 },
      { value: 'B', total: 3 }
    ]
  })
  const data = transformAggsBased(ctx)
  expect(data.datasets[0].percentages).toEqual([25, 75])
})

test('date groupBy formats labels through formatDateLabel', () => {
  const ctx = baseCtx({
    chart: { type: 'line', config: { type: 'aggsBased', groupBy: { type: 'date', field: 'date', interval: 'month' }, size: 10 } },
    aggs: [
      { value: '2024-03-01', total: 1 },
      { value: '2024-04-01', total: 2 }
    ]
  })
  const data = transformAggsBased(ctx)
  expect(data.labels).toEqual([['mars 2024'], ['avr. 2024']])
})
