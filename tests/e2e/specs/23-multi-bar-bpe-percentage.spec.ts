// 23 — multi-bar bpe — percentage mode
// Covers: multi-bar, aggsBased with groupsField, stacked=true, percentage=true
// (series values are converted to percentages of the stacked total).
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggFixtures } from '../fixtures/api-responses'

const test = setupChartTest('23-multi-bar-bpe-percentage', {
  valuesAgg: valuesAggFixtures.multi_bar_bpe_secteur
})

test('renders a multi-bar chart in percentage mode', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})

test('renders the stack switch', async ({ chartPage }) => {
  const actionsContainer = chartPage.locator('.actions-container')
  await expect(actionsContainer).toBeVisible()
  await expect(actionsContainer.locator('.v-switch')).toBeVisible()
})
