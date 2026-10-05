// Transverse — actions UI: dynamicMetric selector, dynamicSort, stack toggle
// Covers: Actions.vue is rendered for charts that have user-controllable options.
// We test three configs: dynamicMetric (15), dynamicSort (11), and stack toggle (06).
import { test } from '@playwright/test'
import { expect, setupChartTest, prepareChartPage } from '../helpers/test-fixture'
import { mockDataFairApi } from '../helpers/mock-api'
import { injectConfig, waitForChart } from '../helpers/inject-config'
import { datasets, makeDatasetEntry } from '../fixtures/datasets'
import { configs } from '../fixtures/configs'
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

// disableDynamicStack=true : la bascule est masquée, aucun conteneur d'actions
// vide ne subsiste, et la config (stacked: true) fait loi sur un ?stacked=...
// résiduel (URL partagée, ancienne session).
test('disableDynamicStack hides the stack switch and clears a stale stacked param', async ({ page }) => {
  await prepareChartPage(page)
  await page.goto('/app/?stacked=false')
  const entry = configs['06-multi-bar-bpe-secteur']
  const dataset = datasets[entry.dataset]
  await mockDataFairApi(page, dataset.id, { valuesAgg: valuesAggFixtures.multi_bar_bpe_secteur })
  await injectConfig(page, {
    ...entry.config,
    chart: { ...entry.config.chart, disableDynamicStack: true },
    datasets: [makeDatasetEntry(entry.dataset)]
  })
  await waitForChart(page)
  await expect(page).toHaveURL(/stacked=true/)
  await expect(page.locator('.v-switch')).toHaveCount(0)
  await expect(page.locator('.actions-container')).toHaveCount(0)
})
