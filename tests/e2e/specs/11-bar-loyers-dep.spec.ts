// 11 — bar loyers — tri desc, dynamicSort
// Covers: bar chart, aggsBased, dynamicSort=true (Actions.vue shows sort selector).
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggFixtures } from '../fixtures/api-responses'

const test = setupChartTest('11-bar-loyers-dep', {
  valuesAgg: valuesAggFixtures.bar_loyers_dep
})

test('renders a bar chart with dynamicSort', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})

test('shows the dynamic sort selector', async ({ chartPage }) => {
  // Actions.vue renders a v-select for the sort-by field when dynamicSort=true.
  // We look for any .v-select in the actions container.
  const actionsContainer = chartPage.locator('.actions-container')
  await expect(actionsContainer).toBeVisible()
  await expect(actionsContainer.locator('.v-select')).toHaveCount(1)
})
