// 29 — pie bpe — aggsLabels sur colonnes booléennes
// Covers: pie chart, aggsLabels mode (parallel /metric_agg calls) with boolean
// valuesFields, metric=sum (nombre de « oui ») sur chaque colonne.
import { expect, setupChartTest } from '../helpers/test-fixture'
import { metricAggFixtures } from '../fixtures/api-responses'

// Per-test registry of the /metric_agg calls, asserted in the test body.
const metricAggRequests: URLSearchParams[] = []

const test = setupChartTest('29-pie-bpe-booleans', {
  metrics: metricAggFixtures,
  metricAggRequests
})

test('renders a pie chart from boolean columns', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})

test('aggregates each boolean field with metric=sum', async ({ chartPage }) => {
  // chartPage boots the app in this worker: fullyParallel isolates module
  // state per test, so the capture must happen within the same test.
  await expect.poll(() => metricAggRequests.length).toBe(3)
  const fields = metricAggRequests.map((p) => p.get('field')).sort()
  expect(fields).toEqual(['indic_capa', 'indic_nbsalles', 'irisee'])
  for (const p of metricAggRequests) {
    expect(p.get('metric')).toBe('sum')
  }
})
