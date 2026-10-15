// Unit tests — émission et rendu d'une sélection inter-app (`_s_`) : helpers purs
// de src/assets/selection.ts (clés de filtre, valeurs désignées, bascule, mise
// en évidence).
import { test, expect } from '@playwright/test'
import { findSelectionFilters, selectionMarkerKey, selectionMarkerValue } from '@data-fair/lib-vue/selection-filters.js'
import { selectionFilterKey, selectionValuesForTarget, nextSelectionValue, applySelectionHighlight, type SelectionTarget } from '../../src/assets/selection'

const conceptTarget: SelectionTarget = { fieldKey: 'dep', conceptId: 'codeDepartement', datasetId: 'ds1' }
const plainTarget: SelectionTarget = { fieldKey: 'categorie', datasetId: 'ds1' }

test('selectionFilterKey writes a single eq key, portable concept or dataset-scoped', () => {
  expect(selectionFilterKey(conceptTarget)).toBe('_c_codeDepartement_eq')
  expect(selectionFilterKey(plainTarget)).toBe('_d_ds1_categorie_eq')
})

test('selectionValuesForTarget reads the marked filters of its own abscissa only', () => {
  const params = {
    _c_codeDepartement_in: '75,92',
    _s_codeDepartement: 'app_other',
    _d_ds1_dep_eq: '69',
    _s_ds1_dep: 'page_x',
    _c_codeRegion_in: '11',
    _s_codeRegion: 'page_x',
    _c_year_gte: '2020',
    _s_year: 'page_x'
  }
  const filters = findSelectionFilters(params, 'ds1')
  // concept portable + miroir dataset-scopé du même champ, la plage (`gte`) est écartée
  expect(selectionValuesForTarget(filters, conceptTarget)).toEqual(['75', '92', '69'])
  expect(selectionValuesForTarget(filters, plainTarget)).toEqual([])
})

test('selectionValuesForTarget matches a dataset field when the target has no concept', () => {
  const filters = findSelectionFilters({ _d_ds1_categorie_in: '"A","B"', _s_ds1_categorie: 'app_x' }, 'ds1')
  expect(selectionValuesForTarget(filters, plainTarget)).toEqual(['A', 'B'])
})

test('nextSelectionValue replaces the selection and clears on the sole selected value', () => {
  expect(nextSelectionValue([], 'A')).toEqual(['A'])
  expect(nextSelectionValue(['A'], 'B')).toEqual(['B'])
  // une sélection multiple reçue (`_in`) est ramenée à la valeur cliquée
  expect(nextSelectionValue(['A', 'B'], 'A')).toEqual(['A'])
  // re-clic sur la valeur déjà seule sélectionnée
  expect(nextSelectionValue(['A'], 'A')).toEqual([])
})

test('selection keys round-trip through the marker helpers', () => {
  const filters = findSelectionFilters({ _c_codeDepartement_eq: '75', _s_codeDepartement: selectionMarkerValue('abc')! }, undefined)
  expect(filters[0].source).toBe('app_abc')
  expect(selectionMarkerKey('_c_codeDepartement_eq')).toBe('_s_codeDepartement')
  expect(selectionMarkerKey(selectionFilterKey(plainTarget))).toBe('_s_ds1_categorie')
})

test('applySelectionHighlight keeps the background type stable (scalar base becomes a base array)', () => {
  const data = { labels: [['A'], ['B']], rawLabels: ['A', 'B'], datasets: [{ backgroundColor: '#111111', data: [1, 2] }] }
  // aucune sélection : le fond est déjà un tableau de base — un type stable évite
  // que Chart.js ne réévalue pas les options par élément en repassant à une chaîne
  const none = applySelectionHighlight(data, [])
  expect(none).not.toBe(data)
  expect(none.datasets[0].backgroundColor).toEqual(['#111111', '#111111'])
  expect(applySelectionHighlight(data, ['Z']).datasets[0].backgroundColor).toEqual(['#111111', '#111111'])
  // sans rawLabels, rien à faire
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
  // le transform n'est pas muté
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

// les datasets multi-bar portent aussi un pointStyle : c'est le type de graphique qui décide
test('applySelectionHighlight fades multi-bar backgrounds despite their pointStyle', () => {
  const data = { labels: [['A'], ['B']], rawLabels: ['A', 'B'], datasets: [{ pointStyle: 'circle', backgroundColor: '#333333', data: [1, 2] }] }
  const out = applySelectionHighlight(data, ['A'])
  expect(out.datasets[0].backgroundColor[0]).toBe('#333333')
  expect(out.datasets[0].backgroundColor[1]).toContain('rgba(')
})

// vue-chartjs ne retire jamais une clé absente du dataset de base : les courbes
// doivent réécrire pointBackgroundColor même sans sélection, sinon l'estompage
// reste collé après désélection
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
