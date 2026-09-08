// 20 — line loyers — groupBy number interval
// Covers: line chart, aggsBased, groupBy type=number with interval=2,
// area fill, theme color 'secondary', aggSortBy='label', sortOrder='asc'.
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggFixtures } from '../fixtures/api-responses'

const test = setupChartTest('20-line-loyers-distribution', {
  valuesAgg: valuesAggFixtures.line_loyers_distribution
})

test('renders a line chart with groupBy number', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})
