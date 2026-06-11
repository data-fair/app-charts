// 18 — bar alim — staticFilters (Paris)
// Covers: bar chart, aggsBased, staticFilters on dep_name=Paris.
// The staticFilters are passed in the config and the app converts them to qs.
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggFixtures } from '../fixtures/api-responses'

const test = setupChartTest('18-bar-alim-filtre-paris', {
  valuesAgg: valuesAggFixtures.bar_alim_filtre_paris
})

test('renders a bar chart with staticFilters applied', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})
