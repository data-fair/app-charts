// Unit tests — aggsBasedLabels transform (pure API response -> Chart.js data)
import { test, expect } from '@playwright/test'
import transformAggsBasedLabels, { type AggsBasedLabelsContext } from '../../src/composables/chart-data/aggsBasedLabels'

function baseCtx (overrides: Partial<AggsBasedLabelsContext> & { chart: any }): AggsBasedLabelsContext {
  return {
    config: {},
    fields: {
      surface: { label: 'Surface' },
      population: { label: 'Population' }
    },
    finalizedAt: undefined,
    baseParams: {},
    metric: 'sum',
    getValue: (v) => (v == null ? undefined : v),
    stacked: undefined,
    aggs: [],
    ...overrides
  }
}

test('one dataset per aggregation, labels from labelsValues fields', () => {
  const ctx = baseCtx({
    chart: {
      type: 'radar',
      config: { type: 'aggsBasedLabels', valuesLabel: 'category', labelsValues: ['surface', 'population'], size: 10 }
    },
    aggs: [
      { value: 'H', metric: 30, population_sum: 12 },
      { value: 'F', metric: 40, population_sum: 14 }
    ]
  })
  const data = transformAggsBasedLabels(ctx)
  expect(data.labels).toEqual([['Surface'], ['Population']])
  expect(data.datasets).toHaveLength(2)
  // first labelsValues entry reads serie.metric, next ones read `<field>_<metric>`
  expect(data.datasets[0].data).toEqual([30, 12])
  expect(data.datasets[1].data).toEqual([40, 14])
})

test('labelsValues are mapped through field labels and removeFromLabels', () => {
  const ctx = baseCtx({
    chart: {
      type: 'radar',
      config: { type: 'aggsBasedLabels', valuesLabel: 'category', labelsValues: ['surface'], removeFromLabels: 'Surface ', size: 10 }
    },
    fields: { surface: { label: 'Surface totale' } },
    aggs: [{ value: 'H', metric: 1 }]
  })
  const data = transformAggsBasedLabels(ctx)
  expect(data.labels).toEqual([['totale']])
})

test('colorOrder manual reorders the series', () => {
  const ctx = baseCtx({
    chart: {
      type: 'radar',
      config: {
        type: 'aggsBasedLabels',
        valuesLabel: 'category',
        labelsValues: ['surface'],
        size: 10,
        colorOrder: { type: 'manual', entries: [{ key: 'F' }, { key: 'H' }] }
      }
    },
    aggs: [
      { value: 'H', metric: 1 },
      { value: 'F', metric: 2 }
    ]
  })
  const data = transformAggsBasedLabels(ctx)
  expect(data.datasets.map((d: any) => d.label)).toEqual(['F', 'H'])
  expect(data.datasets.map((d: any) => d.data[0])).toEqual([2, 1])
})
