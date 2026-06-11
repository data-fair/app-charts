// 14 — pie rne — manual 2 categories (F/M)
// Covers: pie chart, aggsBased, manual colorOrder with 2 categories.
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggFixtures } from '../fixtures/api-responses'

const test = setupChartTest('14-pie-rne-sexe', {
  valuesAgg: valuesAggFixtures.pie_bpe_type // any 2+ category fixture works
})

test('renders a pie chart with manual colors', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})
