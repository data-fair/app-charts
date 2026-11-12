// 30 — multi-bar bpe — aggsBasedLabels, x-axis defined by several
// boolean columns
// Covers: « Grouper les lignes, abscisses définies par plusieurs
// colonnes » mode (aggsBasedLabels) with boolean labelsValues: the 1st field goes
// through metric_field (`metric` response), the next ones through extra_metrics
// (`<field>_sum` response = number of « oui »). Series remain a category
// column (valuesLabel = reg).
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
    'indic_capa:value_count',
    'indic_nbsalles:sum',
    'indic_nbsalles:value_count',
    'irisee:sum',
    'irisee:value_count'
  ])
})
