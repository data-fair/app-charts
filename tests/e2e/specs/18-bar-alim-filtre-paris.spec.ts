// 18 — bar alim — staticFilters (Paris)
// Covers: bar chart, aggsBased, staticFilters on dep_name=Paris.
// The staticFilters are passed in the config and converted to REST query
// params (`dep_name_in=Paris`) by filters2params.
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggFixtures } from '../fixtures/api-responses'

const valuesAggRequests: URLSearchParams[] = []
const test = setupChartTest('18-bar-alim-filtre-paris', {
  valuesAgg: valuesAggFixtures.bar_alim_filtre_paris,
  valuesAggRequests
})

test('renders a bar chart with staticFilters applied', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('sends the static filters as REST params on /values_agg', async ({ chartPage }) => {
  // chartPage boots the app in this worker: fullyParallel isolates module
  // state per test, so the capture must happen within the same test.
  await expect.poll(() => valuesAggRequests.length).toBeGreaterThanOrEqual(1)
  expect(valuesAggRequests[0].get('dep_name_in')).toBe('Paris')
  expect(valuesAggRequests[0].get('qs')).toBeNull()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})
