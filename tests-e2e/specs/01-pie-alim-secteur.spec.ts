// 01 — pie aggsBased — cutout, display: both, sumInTitle
// Covers: pie chart, aggsBased mode, valueCalc=count, palette colors,
// cutout > 0 (donut), display='both' (values + percentages), sumInTitle.
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggFixtures } from '../fixtures/api-responses'

const test = setupChartTest('01-pie-alim-secteur', {
  valuesAgg: valuesAggFixtures.pie_alim_secteur
})

test('renders a pie chart with the values_agg fixture', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('pie chart canvas has a reasonable size', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  const box = await canvas.boundingBox()
  expect(box).toBeTruthy()
  expect(box!.width).toBeGreaterThan(100)
  expect(box!.height).toBeGreaterThan(100)
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})
