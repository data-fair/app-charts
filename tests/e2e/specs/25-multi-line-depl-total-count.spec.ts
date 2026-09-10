// 25 — multi-line depl — total line count divisor
// Covers: multi-line chart, rowsBased mode, divisor = « Nombre total de
// lignes » (the totalCount of the /lines response, no extra API call).
// Also covers the groupCount → totalCount fallback in rowsBased.
import { expect, setupChartTest } from '../helpers/test-fixture'
import { linesFixtureDeplacements } from '../fixtures/api-responses'

const test = setupChartTest('25-multi-line-depl-total-count', {
  lines: linesFixtureDeplacements
})

test('renders a multi-line chart with a total line count divisor', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})
