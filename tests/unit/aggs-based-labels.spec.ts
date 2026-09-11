// Unit tests — aggsBasedLabels transform (pure API response -> Chart.js data)
import { test, expect } from '@playwright/test'
import transformAggsBasedLabels, { type AggsBasedLabelsContext } from '../../src/composables/chart-data/aggsBasedLabels'
import { extractDividerValue } from '../../src/assets/utils'

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

test('column divider divides each serie by its own extra metric', () => {
  const divider = { type: 'column', field: 'pop', metric: 'sum' } as const
  const ctx = baseCtx({
    chart: {
      type: 'radar',
      config: { type: 'aggsBasedLabels', valuesLabel: 'category', labelsValues: ['surface', 'population'], size: 10 }
    },
    getValue: (v, source) => {
      if (v == null) return undefined
      const d = extractDividerValue(source, divider)
      if (d === undefined || d === 0) return undefined
      return v / d
    },
    aggs: [
      { value: 'H', metric: 30, population_sum: 12, pop_sum: 2 },
      { value: 'F', metric: 40, population_sum: 14, pop_sum: 0 } // diviseur nul → valeurs masquées
    ]
  })
  const data = transformAggsBasedLabels(ctx)
  expect(data.datasets[0].data).toEqual([15, 6])
  expect(data.datasets[1].data).toEqual([undefined, undefined])
})

// ── Colonnes booléennes en abscisses (mode aggsBasedLabels) ─────────────────

test('boolean labelsValues are aggregated via metric and <field>_<metric>', () => {
  const ctx = baseCtx({
    chart: {
      type: 'multi-bar',
      config: {
        type: 'aggsBasedLabels',
        valuesLabel: 'reg',
        labelsValues: ['indic_capa', 'indic_nbsalles', 'irisee'],
        metric: 'sum',
        size: 10
      }
    },
    fields: {
      indic_capa: { label: 'Capacité' },
      indic_nbsalles: { label: 'Salles' },
      irisee: { label: 'IRISée' }
    },
    aggs: [
      { value: 'Île-de-France', metric: 1234, indic_nbsalles_sum: 456, irisee_sum: 789 },
      { value: 'PACA', metric: 987, indic_nbsalles_sum: 321, irisee_sum: 654 }
    ]
  })
  const data = transformAggsBasedLabels(ctx)
  expect(data.labels).toEqual([['Capacité'], ['Salles'], ['IRISée']])
  expect(data.datasets.map((d: any) => d.label)).toEqual(['Île-de-France', 'PACA'])
  // 1er champ booléen lu dans serie.metric, les suivants dans `<field>_sum`
  expect(data.datasets[0].data).toEqual([1234, 456, 789])
  expect(data.datasets[1].data).toEqual([987, 321, 654])
})

// ── Libellés des valeurs booléennes (config.booleanLabels) ──────────────────

test('boolean valuesLabel values are replaced by the configured labels', () => {
  const ctx = baseCtx({
    chart: {
      type: 'radar',
      config: { type: 'aggsBasedLabels', valuesLabel: 'category', labelsValues: ['surface'], size: 10 }
    },
    config: { booleanLabels: { trueLabel: 'Oui', falseLabel: 'Non' } },
    aggs: [
      { value: true, metric: 30 },
      { value: false, metric: 40 }
    ]
  })
  const data = transformAggsBasedLabels(ctx)
  expect(data.datasets.map((d: any) => d.label)).toEqual(['Oui', 'Non'])
})
