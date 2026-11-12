// 31 — combo (Graphique mixte): one column as bars on the right
// axis, the other as a line on the left axis. The Chart.js render is checked
// by instrumenting fillText: both axes must be drawn, each with
// its own title, the secondary axis on the right of the chart.
import type { CapturedText } from '../helpers/canvas-text'
import { test, expect } from '@playwright/test'
import { prepareChartPage } from '../helpers/test-fixture'
import { mockDataFairApi } from '../helpers/mock-api'
import { injectConfig, waitForChart } from '../helpers/inject-config'
import { setupCanvasTextCapture } from '../helpers/canvas-text'
import { datasets, makeDatasetEntry } from '../fixtures/datasets'
import { configs } from '../fixtures/configs'
import { linesFixtureLoyersIntervalles } from '../fixtures/api-responses'

test('renders a curve and a histogram, with a titled secondary axis on the right', async ({ page }) => {
  await setupCanvasTextCapture(page)
  await prepareChartPage(page)
  await page.goto('/app/')
  const entry = configs['31-combo-loyers-axes']
  const dataset = datasets[entry.dataset]
  await mockDataFairApi(page, dataset.id, { lines: linesFixtureLoyersIntervalles })
  await injectConfig(page, { ...entry.config, datasets: [makeDatasetEntry(entry.dataset)] })
  await waitForChart(page)

  await expect(page.locator('canvas').first()).toBeVisible()
  await expect(page.locator('.v-empty-state')).toHaveCount(0)

  // let the animation finish: the last captured frame is stable
  await page.waitForTimeout(2000)
  const texts = await page.evaluate(() => (window as unknown as { __texts: CapturedText[] }).__texts)
  const leftTitle = texts.find((t) => t.text === 'Loyer (€/m²)')
  const rightTitle = texts.find((t) => t.text === 'Intervalle (€/m²)')
  expect(leftTitle).toBeTruthy()
  expect(rightTitle).toBeTruthy()
  expect(leftTitle!.x).toBeLessThan(leftTitle!.canvasWidth / 2)
  expect(rightTitle!.x).toBeGreaterThan(rightTitle!.canvasWidth / 2)

  // the right-axis series is explicitly attached to its ticks
  // (the legend is redrawn on every frame: deduplicate)
  const rightLegend = [...new Set(texts.filter((t) => t.text.endsWith('(axe droit)')).map((t) => t.text))]
  expect(rightLegend).toEqual(['Borne basse intervalle de prédiction (axe droit)'])
})
