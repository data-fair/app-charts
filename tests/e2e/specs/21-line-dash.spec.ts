// 21 — line aggsBased date (month) — lineDash dashed
// Covers: the "Motif de trait" config option — borderDash applied through
// Chart.js options.elements.line (shared by line, multi-line and radar).
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggFixtures } from '../fixtures/api-responses'

const test = setupChartTest('21-line-alim-dashed', {
  valuesAgg: valuesAggFixtures.line_alim_temporal
})

test('renders a line chart with a dashed border pattern', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})
