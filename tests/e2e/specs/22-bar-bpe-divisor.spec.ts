// 22 — bar bpe — column divisor
// Covers: bar chart, aggsBased, divisor = aggregate of another column of the
// same dataset per group (extra metric <field>_<metric> in the same values_agg
// response), groups without divisor are hidden.
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggFixtures } from '../fixtures/api-responses'

const test = setupChartTest('22-bar-bpe-divisor', {
  valuesAgg: valuesAggFixtures.bar_bpe_divisor
})

test('renders a bar chart with a column divisor', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})
