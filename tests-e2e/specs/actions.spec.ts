// Transverse — actions UI: dynamicMetric selector, dynamicSort, stack toggle
// Covers: Actions.vue is rendered for charts that have user-controllable options.
// We test three configs: dynamicMetric (15), dynamicSort (11), and stack toggle (06).
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggFixtures } from '../fixtures/api-responses'

// dynamicMetric + dynamicSort + sortField (3 selectors)
const testRne = setupChartTest('15-multi-bar-rne-age', {
  valuesAgg: valuesAggFixtures.multi_bar_bpe_metrics
})
testRne('dynamicMetric renders a metric v-select', async ({ chartPage }) => {
  const actionsContainer = chartPage.locator('.actions-container')
  await expect(actionsContainer).toBeVisible()
  // The first v-select is the metric selector (label "Métrique")
  const metricSelect = actionsContainer.locator('.v-select').first()
  await expect(metricSelect).toBeVisible()
  await expect(metricSelect).toContainText('Métrique')
})

// dynamicSort only (1 selector)
const testLoyers = setupChartTest('11-bar-loyers-dep', {
  valuesAgg: valuesAggFixtures.bar_loyers_dep
})
testLoyers('dynamicSort renders a sort-by v-select', async ({ chartPage }) => {
  const actionsContainer = chartPage.locator('.actions-container')
  await expect(actionsContainer).toBeVisible()
  await expect(actionsContainer.locator('.v-select').first()).toBeVisible()
})

// multi-bar with disableDynamicStack=false renders a stack switch
const testBpe = setupChartTest('06-multi-bar-bpe-secteur', {
  valuesAgg: valuesAggFixtures.multi_bar_bpe_secteur
})
testBpe('multi-bar with disableDynamicStack=false renders a stack switch', async ({ chartPage }) => {
  const actionsContainer = chartPage.locator('.actions-container')
  await expect(actionsContainer).toBeVisible()
  await expect(actionsContainer.locator('.v-switch')).toBeVisible()
})
