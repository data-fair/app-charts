// Unit tests — aggsBasedLabels transform (pure API response -> Chart.js data)
import type { AggsBasedLabelsContext } from '../../src/composables/chart-data/aggsBasedLabels'
import { test, expect } from '@playwright/test'
import transformAggsBasedLabels from '../../src/composables/chart-data/aggsBasedLabels'
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

test('a labelsValues column with no value (value_count = 0) is a gap, not a zero', () => {
  const ctx = baseCtx({
    chart: {
      type: 'multi-line',
      config: { type: 'aggsBasedLabels', valuesLabel: 'indicateur', labelsValues: ['y2023', 'y2024'], size: 10 }
    },
    aggs: [
      // y2023 empty for A, y2024 real 0 (3 values) for A
      { value: 'A', metric: 0, y2023_value_count: 0, y2024_sum: 0, y2024_value_count: 3 },
      // y2023 filled, y2024 empty for B
      { value: 'B', metric: 12, y2023_value_count: 1, y2024_sum: 0, y2024_value_count: 0 }
    ]
  })
  const data = transformAggsBasedLabels(ctx)
  expect(data.datasets[0].data).toEqual([undefined, 0])
  expect(data.datasets[1].data).toEqual([12, undefined])
})

test('percentage mode keeps missing values missing (no NaN)', () => {
  const ctx = baseCtx({
    chart: {
      type: 'multi-bar',
      percentage: true,
      config: { type: 'aggsBasedLabels', valuesLabel: 'reg', labelsValues: ['y2023', 'y2024'], size: 10 }
    },
    aggs: [
      { value: 'A', metric: 1, y2023_value_count: 1, y2024_sum: 2, y2024_value_count: 1 },
      { value: 'B', metric: 3, y2023_value_count: 1, y2024_sum: 0, y2024_value_count: 0 }
    ]
  })
  const data = transformAggsBasedLabels(ctx)
  // y2023: normalized 25/75; y2024: B missing, A stays at 100
  expect(data.datasets[0].data).toEqual([25, 100])
  expect(data.datasets[1].data).toEqual([75, undefined])
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
      { value: 'F', metric: 40, population_sum: 14, pop_sum: 0 } // zero divider → hidden values
    ]
  })
  const data = transformAggsBasedLabels(ctx)
  expect(data.datasets[0].data).toEqual([15, 6])
  expect(data.datasets[1].data).toEqual([undefined, undefined])
})

// ── Boolean columns as x-axis (aggsBasedLabels mode) ────────────────────────

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
  // 1st boolean field read in serie.metric, the next ones in `<field>_sum`
  expect(data.datasets[0].data).toEqual([1234, 456, 789])
  expect(data.datasets[1].data).toEqual([987, 321, 654])
})

// ── Labels of boolean values (config.booleanLabels) ─────────────────────────

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

// ── Targets from the data (objectifFields) ──────────────────────────────────

test('objectifFields add a dashed constant line per series, on the labels axis', () => {
  const ctx = baseCtx({
    chart: {
      type: 'multi-bar',
      config: {
        type: 'aggsBasedLabels',
        valuesLabel: 'reg',
        labelsValues: ['surface', 'population'],
        objectifFields: ['objectif_2030'],
        size: 10
      }
    },
    fields: { objectif_2030: { label: 'Objectif 2030' } },
    aggs: [
      { value: 'A', metric: 30, population_sum: 12, objectif_2030_avg: 60 },
      { value: 'B', metric: 40, population_sum: 14 } // no target set
    ]
  })
  const data = transformAggsBasedLabels(ctx)
  // 2 series + 1 target (B has none)
  expect(data.datasets).toHaveLength(3)
  const target = data.datasets[2]
  expect(target).toMatchObject({
    type: 'line',
    label: 'Objectif 2030 – A',
    pointStyle: false,
    fill: false,
    borderColor: '#E53935'
  })
  expect(target.borderDash).toEqual([6, 6])
  expect(target.data).toEqual([60, 60])
  // own stack group: the target is never summed with the series
  expect(target.stack).toBe('objectif-0-0')
})

test('several objectives get distinct colours and stack groups', () => {
  const ctx = baseCtx({
    chart: {
      type: 'multi-line',
      config: {
        type: 'aggsBasedLabels',
        valuesLabel: 'reg',
        labelsValues: ['surface'],
        objectifFields: ['objectif_2030', 'objectif_2050'],
        size: 10
      }
    },
    fields: { objectif_2030: { label: 'Objectif 2030' }, objectif_2050: { label: 'Objectif 2050' } },
    aggs: [
      { value: 'A', metric: 30, objectif_2030_avg: 60, objectif_2050_avg: 20 },
      { value: 'B', metric: 40, objectif_2030_avg: 60, objectif_2050_avg: 20 }
    ]
  })
  const data = transformAggsBasedLabels(ctx)
  const targets = data.datasets.slice(2)
  expect(targets).toHaveLength(4)
  // one color per target (stable for both series), unique stack group
  expect(targets.map((d: any) => d.borderColor)).toEqual(['#E53935', '#1E88E5', '#E53935', '#1E88E5'])
  expect(new Set(targets.map((d: any) => d.stack)).size).toBe(4)
})

test('a single series keeps the objective label unsuffixed', () => {
  const ctx = baseCtx({
    chart: {
      type: 'multi-line',
      config: { type: 'aggsBasedLabels', valuesLabel: 'reg', labelsValues: ['surface'], objectifFields: ['objectif_2030'], size: 10 }
    },
    fields: { objectif_2030: { label: 'Objectif 2030' } },
    aggs: [{ value: 'A', metric: 30, objectif_2030_avg: 60 }]
  })
  const data = transformAggsBasedLabels(ctx)
  expect(data.datasets.map((d: any) => d.label)).toEqual(['A', 'Objectif 2030'])
})

test('objectives are not normalised by percentage and are ignored on radial charts', () => {
  const base = {
    fields: { objectif_2030: { label: 'Objectif 2030' } },
    aggs: [
      { value: 'A', metric: 1, objectif_2030_avg: 60 },
      { value: 'B', metric: 1 }
    ]
  }
  const percent = transformAggsBasedLabels(baseCtx({
    chart: {
      type: 'multi-bar',
      percentage: true,
      config: { type: 'aggsBasedLabels', valuesLabel: 'reg', labelsValues: ['surface'], objectifFields: ['objectif_2030'], size: 10 }
    },
    ...base
  }))
  // series normalized to 50/50, target untouched
  expect(percent.datasets[0].data).toEqual([50])
  expect(percent.datasets[1].data).toEqual([50])
  expect(percent.datasets[2].data).toEqual([60])

  const radar = transformAggsBasedLabels(baseCtx({
    chart: {
      type: 'radar',
      config: { type: 'aggsBasedLabels', valuesLabel: 'reg', labelsValues: ['surface'], objectifFields: ['objectif_2030'], size: 10 }
    },
    ...base
  }))
  expect(radar.datasets).toHaveLength(2)
})

// ── Label overrides (config.valueLabels) ────────────────────────────────────

test('valueLabels rename valuesLabel series and labelsValues columns', () => {
  const ctx = baseCtx({
    chart: {
      type: 'radar',
      config: { type: 'aggsBasedLabels', valuesLabel: 'category', labelsValues: ['surface', 'population'], size: 10 }
    },
    config: {
      valueLabels: [
        { value: 'H', label: 'Hôpital' },
        { value: 'surface', label: 'Surface totale' }
      ]
    },
    aggs: [
      { value: 'H', metric: 30, population_sum: 12 },
      { value: 'F', metric: 40, population_sum: 14 }
    ]
  })
  const data = transformAggsBasedLabels(ctx)
  expect(data.labels).toEqual([['Surface totale'], ['Population']])
  expect(data.datasets.map((d: any) => d.label)).toEqual(['Hôpital', 'F'])
})
