// 05 — bar rpg — avg metric, custom color
// Covers: bar chart, aggsBased, valueCalc=metric with avg, custom hex color.
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggFixtures } from '../fixtures/api-responses'

const test = setupChartTest('05-bar-rpg-surface', {
  valuesAgg: valuesAggFixtures.bar_rpg_surface
})

test('renders a bar chart with avg metric', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})
