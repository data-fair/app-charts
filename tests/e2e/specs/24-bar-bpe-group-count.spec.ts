// 24 — bar bpe — group line count divisor
// Covers: bar chart, aggsBased, divisor = « Nombre de lignes du groupe »
// (the bucket `total` of the same values_agg response), groups without a
// usable total are hidden. No extra API call is expected.
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggFixtures } from '../fixtures/api-responses'

const test = setupChartTest('24-bar-bpe-group-count', {
  valuesAgg: valuesAggFixtures.bar_bpe_group_count
})

test('renders a bar chart with a group line count divisor', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})
