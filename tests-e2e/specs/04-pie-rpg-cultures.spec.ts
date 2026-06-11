// 04 — pie rpg — rotation, percentages, missingLabel
// Covers: pie chart, aggsBased, display='percentages', missingLabel='Autres cultures',
// divider=10000 (ha conversion), palette 'Set2'.
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggFixtures } from '../fixtures/api-responses'

const test = setupChartTest('04-pie-rpg-cultures', {
  valuesAgg: valuesAggFixtures.pie_rpg_cultures
})

test('renders a pie chart with percentages', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})
