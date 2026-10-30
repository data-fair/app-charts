// 31 — combo (Graphique mixte) : une colonne en histogramme sur l'axe de
// droite, l'autre en courbe sur l'axe de gauche. Le rendu Chart.js est vérifié
// en instrumentant fillText : les deux axes doivent être dessinés, chacun avec
// son propre titre, l'axe secondaire à droite du graphique.
import { test, expect } from '@playwright/test'
import { prepareChartPage } from '../helpers/test-fixture'
import { mockDataFairApi } from '../helpers/mock-api'
import { injectConfig, waitForChart } from '../helpers/inject-config'
import { setupCanvasTextCapture, type CapturedText } from '../helpers/canvas-text'
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

  // laisser l'animation se terminer : la dernière frame capturée est stable
  await page.waitForTimeout(2000)
  const texts = await page.evaluate(() => (window as unknown as { __texts: CapturedText[] }).__texts)
  const leftTitle = texts.find((t) => t.text === 'Loyer (€/m²)')
  const rightTitle = texts.find((t) => t.text === 'Intervalle (€/m²)')
  expect(leftTitle).toBeTruthy()
  expect(rightTitle).toBeTruthy()
  expect(leftTitle!.x).toBeLessThan(leftTitle!.canvasWidth / 2)
  expect(rightTitle!.x).toBeGreaterThan(rightTitle!.canvasWidth / 2)

  // la série de l'axe droit est rattachée explicitement à ses graduations
  // (la légende est redessinée à chaque frame : on dédoublonne)
  const rightLegend = [...new Set(texts.filter((t) => t.text.endsWith('(axe droit)')).map((t) => t.text))]
  expect(rightLegend).toEqual(['Borne basse intervalle de prédiction (axe droit)'])
})
