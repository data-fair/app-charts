// 19 — multi-bar bpe — aggsBasedCategories, valuesCalc
// Covers: multi-bar, aggsBasedCategories mode, valuesCalc=[capacite, nbsalles, nblieux],
// dynamicMetric=true, sortField='capacite', dynamicSort=true.
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggFixtures } from '../fixtures/api-responses'

const test = setupChartTest('19-multi-bar-bpe-metrics', {
  valuesAgg: valuesAggFixtures.multi_bar_bpe_metrics
})

test('renders a multi-bar chart with aggsBasedCategories', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})

test('shows the dynamic metric and sort-field selectors', async ({ chartPage }) => {
  // dynamicMetric + dynamicSort both true => metric + sort-by + sort-field
  const actionsContainer = chartPage.locator('.actions-container')
  await expect(actionsContainer).toBeVisible()
  const selects = actionsContainer.locator('.v-select')
  expect(await selects.count()).toBeGreaterThanOrEqual(3)
})
