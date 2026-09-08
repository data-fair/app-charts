// 16 — paired-histo depl — sign flip, 2 valuesFields
// Covers: paired-histogram chart, rowsBased mode, sign flip on data values,
// 2 valuesFields (voit, velo), divider=1000, palette 'Set1' with seriesOrder.
import { expect, setupChartTest } from '../helpers/test-fixture'
import { linesFixtureDeplacements } from '../fixtures/api-responses'

const test = setupChartTest('16-paired-histo-deplacements', {
  lines: linesFixtureDeplacements
})

test('renders a paired-histogram chart with sign flip', async ({ chartPage }) => {
  const canvas = chartPage.locator('canvas').first()
  await expect(canvas).toBeVisible()
})

test('does not render the empty state', async ({ chartPage }) => {
  await expect(chartPage.locator('.v-empty-state')).toHaveCount(0)
})
