// 27 — bar bpe — total line count divisor
// Covers: bar chart, aggsBased, divisor = « Nombre total de lignes »
// (the global count resolved with /metric_agg). The endpoint has no `count`
// metric: the request must use `metric=value_count` (regression — `count`
// silently breaks the divisor).
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggFixtures } from '../fixtures/api-responses'
import type { MockMap } from '../helpers/mock-api'

const metricAggRequests: URLSearchParams[] = []
const mocks: MockMap = {
  valuesAgg: valuesAggFixtures.bar_bpe_total_count,
  metrics: { categorie: { metric: 5 } },
  metricAggRequests
}

const test = setupChartTest('27-bar-bpe-total-count', mocks)

test('renders a bar chart with a total line count divisor', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('resolves the total count with metric=value_count', async ({ chartPage }) => {
  // chartPage boots the app in this worker: fullyParallel isolates module
  // state per test, so the capture must happen within the same test.
  await expect.poll(() => metricAggRequests.length).toBeGreaterThanOrEqual(1)
  const params = metricAggRequests[0]
  expect(params.get('field')).toBe('categorie')
  expect(params.get('metric')).toBe('value_count')
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})
