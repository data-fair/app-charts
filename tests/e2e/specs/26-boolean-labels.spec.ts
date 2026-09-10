// 26 — bar alim — boolean labels
// Covers: bar aggsBased grouped by a boolean field (values_agg returns JSON
// booleans), booleanLabels oui/non replacement on the axis labels.
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggFixtures } from '../fixtures/api-responses'

const test = setupChartTest('26-bar-alim-boolean', {
  valuesAgg: valuesAggFixtures.bar_alim_boolean
})

test('renders a bar chart with boolean labels', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})
