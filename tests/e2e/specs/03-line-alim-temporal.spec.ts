// 03 — line aggsBased date (month) — area, tension, hidePoints
// Covers: line chart, aggsBased mode, groupBy date with month interval, area fill,
// tension, theme color, dynamicSort=false, yAxisStartsZero=false.
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggFixtures } from '../fixtures/api-responses'

const test = setupChartTest('03-line-alim-temporal', {
  valuesAgg: valuesAggFixtures.line_alim_temporal
})

test('renders a line chart with date aggregation', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})
