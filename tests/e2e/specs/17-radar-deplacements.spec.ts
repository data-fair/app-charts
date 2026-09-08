// 17 — radar depl — aggsBasedLabels, labelsValues, valuesLabel
// Covers: radar chart, aggsBasedLabels mode, labelsValues=[voit, velo, trans_com],
// valuesLabel=time_period.
import { expect, setupChartTest } from '../helpers/test-fixture'
import { valuesAggLabelsFixture } from '../fixtures/api-responses'

const test = setupChartTest('17-radar-deplacements', {
  valuesAgg: valuesAggLabelsFixture
})

test('renders a radar chart with aggsBasedLabels data', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})
