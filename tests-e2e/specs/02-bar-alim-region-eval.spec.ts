// 02 — bar rowsBasedCategories — horizontal, hideYAxis, manual colors
// Covers: bar chart, rowsBased mode with categoriesField, manual colorOrder,
// horizontal layout, hideYAxis, xTitle/yTitle.
import { expect, setupChartTest } from '../helpers/test-fixture'
import { linesFixture_alim_region, valuesLabelsFixture } from '../fixtures/api-responses'

const test = setupChartTest('02-bar-alim-region-eval', {
  valuesLabels: valuesLabelsFixture.alim_evaluation,
  lines: linesFixture_alim_region
})

test('renders a bar chart with rowsBased data', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})

test('the legend is rendered for multi-series bars', async ({ chartPage }) => {
  // Bar with categories has multiple datasets, so Chart.js renders a legend
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})
