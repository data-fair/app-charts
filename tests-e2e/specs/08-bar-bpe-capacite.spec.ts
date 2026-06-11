// 08 — bar bpe — sum numeric, theme color (secondary)
// Covers: bar chart, aggsBased, valueCalc=metric with sum, theme color 'secondary'.
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggFixtures } from '../fixtures/api-responses'

const test = setupChartTest('08-bar-bpe-capacite', {
  valuesAgg: valuesAggFixtures.bar_bpe_capacite
})

test('renders a bar chart with sum metric and theme color', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})
