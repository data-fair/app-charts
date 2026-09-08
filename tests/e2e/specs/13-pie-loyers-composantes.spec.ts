// 13 — pie loyers — aggsLabels, multiple valuesFields, cutout
// Covers: pie chart, aggsLabels mode (parallel /metric_agg calls),
// 3 valuesFields, cutout=40, display='both', sumInTitle=true.
import { expect, setupChartTest } from '../helpers/test-fixture'
import { metricAggFixtures } from '../fixtures/api-responses'

const test = setupChartTest('13-pie-loyers-composantes', {
  metrics: metricAggFixtures
})

test('renders a pie chart with aggsLabels data', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})
