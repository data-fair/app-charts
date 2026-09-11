// 30 — multi-bar bpe — aggsBasedLabels, abscisses définies par plusieurs
// colonnes booléennes
// Covers: mode « Grouper les lignes, abscisses définies par plusieurs
// colonnes » (aggsBasedLabels) with boolean labelsValues: le 1er champ passe
// par metric_field (réponse `metric`), les suivants par extra_metrics (réponse
// `<field>_sum` = nombre de « oui »). Les séries restent une colonne de
// catégories (valuesLabel = reg).
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggLabelsBooleansFixture } from '../fixtures/api-responses'

// Per-test registry of the /values_agg calls, asserted in the test body.
const valuesAggRequests: URLSearchParams[] = []

const test = setupChartTest('30-multi-bar-bpe-booleans-labels', {
  valuesAgg: valuesAggLabelsBooleansFixture,
  valuesAggRequests
})

test('renders a multi-bar chart from boolean columns as labels', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})

test('aggregates each boolean label field with metric=sum', async ({ chartPage }) => {
  await expect.poll(() => valuesAggRequests.length).toBeGreaterThan(0)
  const params = valuesAggRequests.find((p) => p.get('field') === 'reg')
  expect(params?.get('metric')).toBe('sum')
  expect(params?.get('metric_field')).toBe('indic_capa')
  expect((params?.get('extra_metrics') || '').split(',').sort()).toEqual([
    'indic_nbsalles:sum',
    'irisee:sum'
  ])
})
