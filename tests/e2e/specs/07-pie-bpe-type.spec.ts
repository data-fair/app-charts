// 07 — pie bpe — simple count, palette
// Covers: pie chart, aggsBased, valueCalc=count, palette 'Accent', display='values'.
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggFixtures } from '../fixtures/api-responses'

const test = setupChartTest('07-pie-bpe-type', {
  valuesAgg: valuesAggFixtures.pie_bpe_type
})

test('renders a pie chart with simple count', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})
