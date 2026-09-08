// Unit tests — aggsLabels transform (pure API response -> Chart.js data)
import { test, expect } from '@playwright/test'
import transformAggsLabels, { type AggsLabelsContext } from '../../src/composables/chart-data/aggsLabels'
function baseCtx (overrides: Partial<AggsLabelsContext> & { chart: any }): AggsLabelsContext {
  return {
    config: {},
    fields: {
      surface: { label: 'Surface' },
      population: { title: 'Population' }
    },
    finalizedAt: undefined,
    baseParams: {},
    metric: undefined,
    getValue: (v) => (v == null ? undefined : v),
    dividerMetric: undefined,
    metrics: [],
    ...overrides
  }
}

test('one value per valuesField, read from the metrics map', () => {
  const ctx = baseCtx({
    chart: { type: 'pie', config: { type: 'aggsLabels', valuesFields: ['surface', 'population'] } },
    metrics: [
      { field: 'surface', metric: 10 },
      { field: 'population', metric: 20 }
    ]
  })
  const data = transformAggsLabels(ctx)
  expect(data.labels).toEqual([['Surface'], ['Population']])
  expect(data.datasets).toHaveLength(1)
  expect(data.datasets[0].data).toEqual([10, 20])
})

test('missing metrics produce undefined values', () => {
  const ctx = baseCtx({
    chart: { type: 'pie', config: { type: 'aggsLabels', valuesFields: ['surface', 'population'] } },
    metrics: [{ field: 'surface', metric: 10 }]
  })
  const data = transformAggsLabels(ctx)
  expect(data.datasets[0].data).toEqual([10, undefined])
})

test('display percentages computes the share of each value', () => {
  const ctx = baseCtx({
    chart: { type: 'pie', display: 'both', config: { type: 'aggsLabels', valuesFields: ['surface', 'population'] } },
    metrics: [
      { field: 'surface', metric: 1 },
      { field: 'population', metric: 3 }
    ]
  })
  const data = transformAggsLabels(ctx)
  expect(data.datasets[0].percentages).toEqual([25, 75])
})

test('getValue divides by config divider', () => {
  const ctx = baseCtx({
    chart: { type: 'pie', config: { type: 'aggsLabels', valuesFields: ['surface'] } },
    getValue: (v) => (v == null ? undefined : v / 1000),
    metrics: [{ field: 'surface', metric: 5500 }]
  })
  const data = transformAggsLabels(ctx)
  expect(data.datasets[0].data).toEqual([5.5])
})

test('global column divider divides every value by the same pre-aggregated metric', () => {
  const ctx = baseCtx({
    chart: { type: 'pie', config: { type: 'aggsLabels', valuesFields: ['surface', 'population'] } },
    getValue: (v, d) => (v == null || !d ? undefined : v / (d as number)),
    dividerMetric: 2,
    metrics: [
      { field: 'surface', metric: 10 },
      { field: 'population', metric: 20 }
    ]
  })
  const data = transformAggsLabels(ctx)
  expect(data.datasets[0].data).toEqual([5, 10])
})

test('missing global divider hides every value', () => {
  const ctx = baseCtx({
    chart: { type: 'pie', config: { type: 'aggsLabels', valuesFields: ['surface', 'population'] } },
    getValue: (v, d) => (v == null || !d ? undefined : v / (d as number)),
    dividerMetric: undefined,
    metrics: [
      { field: 'surface', metric: 10 },
      { field: 'population', metric: 20 }
    ]
  })
  const data = transformAggsLabels(ctx)
  expect(data.datasets[0].data).toEqual([undefined, undefined])
})
