// Unit tests — emitting and rendering an inter-app selection: pure helpers of
// src/assets/selection.ts (filter keys, designated values, toggle,
// highlighting).
import type { ChartSelectionTarget } from '../../src/assets/selection'
import { test, expect } from '@playwright/test'
import { findTargetFilters } from '@data-fair/lib-vue/selection.js'
import { selectionFilterKey, selectionValues, nextSelectionValue, resolveSelectionTarget, applySelectionHighlight } from '../../src/assets/selection'

const conceptTarget: ChartSelectionTarget = { fieldKey: 'dep', conceptId: 'codeDepartement', datasetId: 'ds1' }
const plainTarget: ChartSelectionTarget = { fieldKey: 'categorie', datasetId: 'ds1' }

test('selectionFilterKey writes a single eq key, portable concept or dataset-scoped', () => {
  expect(selectionFilterKey(conceptTarget)).toBe('_c_codeDepartement_eq')
  expect(selectionFilterKey(plainTarget)).toBe('_d_ds1_categorie_eq')
})

test('resolveSelectionTarget reads the abscissa field, or nothing when it is not a field value', () => {
  const fields = { dep: { 'x-concept': { id: 'codeDepartement' } }, cat: {} }
  expect(resolveSelectionTarget({ config: { type: 'rowsBased', labelsField: 'dep' } }, { id: 'ds1' }, fields))
    .toEqual({ fieldKey: 'dep', conceptId: 'codeDepartement', datasetId: 'ds1' })
  expect(resolveSelectionTarget({ config: { type: 'aggsBased', groupBy: { field: { key: 'dep' } } } }, { id: 'ds1' }, fields))
    .toEqual({ fieldKey: 'dep', conceptId: 'codeDepartement', datasetId: 'ds1' })
  // columns as labels / date bucket: no entity
  expect(resolveSelectionTarget({ config: { type: 'aggsBasedLabels' } }, { id: 'ds1' }, fields)).toBeNull()
  expect(resolveSelectionTarget({ config: { type: 'aggsBased', groupBy: { type: 'date', field: 'dep' } } }, { id: 'ds1' }, fields)).toBeNull()
  expect(resolveSelectionTarget({ config: { type: 'rowsBased', labelsField: 'dep' } }, null, fields)).toBeNull()
})

test('selectionValues reads the eq/in filters of the target only, concept then dataset-scoped', () => {
  const params = {
    _c_codeDepartement_in: '75,92',
    _d_ds1_dep_eq: '69',
    _c_codeRegion_in: '11',
    _c_year_gte: '2020'
  }
  // the concept is portable and the dataset-scoped field of the same chart follows it; the range is discarded
  expect(selectionValues(findTargetFilters(params, conceptTarget))).toEqual(['75', '92', '69'])
  expect(selectionValues(findTargetFilters(params, plainTarget))).toEqual([])
})

test('selectionValues matches a dataset field when the target has no concept', () => {
  expect(selectionValues(findTargetFilters({ _d_ds1_categorie_in: '"A","B"' }, plainTarget))).toEqual(['A', 'B'])
})

test('a range on the target stays a selection (the visualization renders it if it can)', () => {
  const filters = findTargetFilters({ _d_ds1_dep_gte: '2020', _d_ds1_dep_lte: '2022' }, conceptTarget)
  expect(filters.map((f) => f.operator)).toEqual(['gte', 'lte'])
  expect(selectionValues(filters)).toEqual([])
})

test('nextSelectionValue replaces the selection and clears on the sole selected value', () => {
  expect(nextSelectionValue([], 'A')).toEqual(['A'])
  expect(nextSelectionValue(['A'], 'B')).toEqual(['B'])
  // a received multiple selection (`_in`) is reduced to the clicked value
  expect(nextSelectionValue(['A', 'B'], 'A')).toEqual(['A'])
  // clicking again the value that is already the only one selected
  expect(nextSelectionValue(['A'], 'A')).toEqual([])
})

test('applySelectionHighlight keeps the background type stable (scalar base becomes a base array)', () => {
  const data = { labels: [['A'], ['B']], rawLabels: ['A', 'B'], datasets: [{ backgroundColor: '#111111', data: [1, 2] }] }
  // no selection: the background is already a base array — a stable type prevents
  // Chart.js from not re-evaluating the per-element options when going back to a string
  const none = applySelectionHighlight(data, [])
  expect(none).not.toBe(data)
  expect(none.datasets[0].backgroundColor).toEqual(['#111111', '#111111'])
  expect(applySelectionHighlight(data, ['Z']).datasets[0].backgroundColor).toEqual(['#111111', '#111111'])
  // without rawLabels, nothing to do
  const empty = { labels: [['A']], datasets: [] }
  expect(applySelectionHighlight(empty, ['A'])).toBe(empty)
})

test('applySelectionHighlight restores the full base array when the selection is cleared', () => {
  const data = { labels: [['A'], ['B']], rawLabels: ['A', 'B'], datasets: [{ backgroundColor: '#111111', data: [1, 2] }] }
  expect(applySelectionHighlight(data, ['B']).datasets[0].backgroundColor[0]).toContain('rgba(')
  expect(applySelectionHighlight(data, []).datasets[0].backgroundColor).toEqual(['#111111', '#111111'])
})

test('applySelectionHighlight fades the non-selected bars and keeps the selected color', () => {
  const data = { labels: [['A'], ['B']], rawLabels: ['A', 'B'], datasets: [{ backgroundColor: '#111111', data: [1, 2] }] }
  const out = applySelectionHighlight(data, ['B'])
  expect(out.datasets[0].backgroundColor[1]).toBe('#111111')
  expect(out.datasets[0].backgroundColor[0]).toContain('rgba(')
  // the transform is not mutated
  expect(data.datasets[0].backgroundColor).toBe('#111111')
})

test('applySelectionHighlight fades pie colors and ignores the "Autre" bucket', () => {
  const data = { labels: [['A'], ['B'], ['Autre']], rawLabels: ['A', 'B', null], datasets: [{ backgroundColor: ['#111111', '#222222', '#333333'], data: [1, 2, 3] }] }
  const out = applySelectionHighlight(data, ['A'])
  expect(out.datasets[0].backgroundColor[0]).toBe('#111111')
  expect(out.datasets[0].backgroundColor[1]).toContain('rgba(')
  expect(out.datasets[0].backgroundColor[2]).toContain('rgba(')
})

test('applySelectionHighlight fades line points, not the line color', () => {
  const data = { labels: [['A'], ['B']], rawLabels: ['A', 'B'], datasets: [{ pointStyle: 'circle', borderColor: '#222222', backgroundColor: '#222222', data: [1, 2] }] }
  const out = applySelectionHighlight(data, ['B'], true)
  expect(out.datasets[0].pointBackgroundColor[1]).toBe('#222222')
  expect(out.datasets[0].pointBackgroundColor[0]).toContain('rgba(')
  expect(out.datasets[0].backgroundColor).toBe('#222222')
})

// mixed chart (Graphique mixte): each dataset follows its own type
test('applySelectionHighlight follows each dataset type in a mixed chart', () => {
  const data = {
    labels: [['A'], ['B']],
    rawLabels: ['A', 'B'],
    datasets: [
      { type: 'line', backgroundColor: '#222222', data: [1, 2] },
      { type: 'bar', backgroundColor: '#333333', data: [3, 4] }
    ]
  }
  const out = applySelectionHighlight(data, ['A'], true)
  expect(out.datasets[0].pointBackgroundColor[0]).toBe('#222222')
  expect(out.datasets[0].pointBackgroundColor[1]).toContain('rgba(')
  expect(out.datasets[1].backgroundColor[0]).toBe('#333333')
  expect(out.datasets[1].backgroundColor[1]).toContain('rgba(')
})

// multi-bar datasets also carry a pointStyle: the chart type decides
test('applySelectionHighlight fades multi-bar backgrounds despite their pointStyle', () => {
  const data = { labels: [['A'], ['B']], rawLabels: ['A', 'B'], datasets: [{ pointStyle: 'circle', backgroundColor: '#333333', data: [1, 2] }] }
  const out = applySelectionHighlight(data, ['A'])
  expect(out.datasets[0].backgroundColor[0]).toBe('#333333')
  expect(out.datasets[0].backgroundColor[1]).toContain('rgba(')
})

// vue-chartjs never removes a key missing from the base dataset: lines
// must rewrite pointBackgroundColor even without a selection, otherwise the dimming
// sticks after deselection
test('applySelectionHighlight resets the line points to their base color without a selection', () => {
  const data = { labels: [['A'], ['B']], rawLabels: ['A', 'B'], datasets: [{ pointStyle: 'circle', borderColor: '#222222', backgroundColor: '#222222', data: [1, 2] }] }
  const out = applySelectionHighlight(data, [], true)
  expect(out).not.toBe(data)
  expect(out.datasets[0].pointBackgroundColor).toEqual(['#222222', '#222222'])
})

test('applySelectionHighlight resolves the line base color per element (borderColor array, backgroundColor fallback)', () => {
  const data = {
    labels: [['A'], ['B']],
    rawLabels: ['A', 'B'],
    datasets: [{ pointStyle: 'circle', borderColor: ['#111111', undefined], backgroundColor: ['#333333', '#444444'], data: [1, 2] }]
  }
  const out = applySelectionHighlight(data, ['B'], true)
  expect(out.datasets[0].pointBackgroundColor[0]).toContain('rgba(')
  expect(out.datasets[0].pointBackgroundColor[1]).toBe('#444444')
})
