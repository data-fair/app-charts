// 12 — multi-line loyers — 3 valuesFields, palette
// Covers: multi-line chart, rowsBased mode with valuesFields array,
// palette 'Dark2' with seriesOrder.
import { expect, setupChartTest } from '../helpers/test-fixture'
import { linesFixture_loyers_intervalles } from '../fixtures/api-responses'

const test = setupChartTest('12-multi-line-loyers-intervalle', {
  lines: linesFixture_loyers_intervalles
})

test('renders a multi-line chart with 3 valuesFields', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})
