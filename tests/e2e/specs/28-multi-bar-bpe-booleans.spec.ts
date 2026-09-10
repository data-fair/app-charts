// 28 — multi-bar bpe — aggsBasedCategories sur colonnes booléennes
// Covers: multi-bar stacked, aggsBasedCategories mode with boolean valuesCalc
// fields, metric=sum (nombre de « oui ») via /values_agg metric_field +
// extra_metrics (convention de réponse `<field>_sum`).
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggFixtures } from '../fixtures/api-responses'

const test = setupChartTest('28-multi-bar-bpe-booleans', {
  valuesAgg: valuesAggFixtures.multi_bar_bpe_booleans
})

test('renders a stacked multi-bar chart from boolean columns', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})

test('shows the stack toggle', async ({ chartPage }) => {
  const actionsContainer = chartPage.locator('.actions-container')
  await expect(actionsContainer).toBeVisible()
  await expect(actionsContainer.locator('.v-switch')).toBeVisible()
})
