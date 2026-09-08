// 10 — bar bpe — avg small integer
// Covers: bar chart, aggsBased, valueCalc=metric with avg, small integer values.
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggFixtures } from '../fixtures/api-responses'

const test = setupChartTest('10-bar-bpe-salles', {
  valuesAgg: valuesAggFixtures.bar_bpe_salles
})

test('renders a bar chart with avg on small integer', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})
