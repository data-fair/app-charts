// 06 — multi-bar bpe — stacked, groupsField, palette
// Covers: multi-bar, aggsBased with groupsField, stacked=true, palette 'Paired'.
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggFixtures } from '../fixtures/api-responses'

const test = setupChartTest('06-multi-bar-bpe-secteur', {
  valuesAgg: valuesAggFixtures.multi_bar_bpe_secteur
})

test('renders a multi-bar chart with groupsField', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})
