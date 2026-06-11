// 15 — multi-bar rne — dynamicMetric, sortField
// Covers: multi-bar, aggsBased, valueCalc=metric with avg, dynamicMetric=true,
// dynamicSort=true, sortField='age' (when sort-by='value').
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggFixtures } from '../fixtures/api-responses'

const test = setupChartTest('15-multi-bar-rne-age', {
  valuesAgg: valuesAggFixtures.multi_bar_bpe_metrics
})

test('renders a multi-bar chart with dynamicMetric', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})

test('shows both metric and sort selectors (dynamicMetric + dynamicSort)', async ({ chartPage }) => {
  // Actions.vue renders a v-select for metric and a v-select for sort-by.
  const actionsContainer = chartPage.locator('.actions-container')
  await expect(actionsContainer).toBeVisible()
  const selects = actionsContainer.locator('.v-select')
  expect(await selects.count()).toBeGreaterThanOrEqual(2)
})
