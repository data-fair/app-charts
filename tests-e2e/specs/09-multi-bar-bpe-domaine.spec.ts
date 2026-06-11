// 09 — multi-bar bpe — groupsField (domaine), palette
// Covers: multi-bar, aggsBased with groupsField, palette colors.
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggFixtures } from '../fixtures/api-responses'

const test = setupChartTest('09-multi-bar-bpe-domaine', {
  valuesAgg: valuesAggFixtures.multi_bar_bpe_domaine
})

test('renders a multi-bar chart with groupsField domaine', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})
