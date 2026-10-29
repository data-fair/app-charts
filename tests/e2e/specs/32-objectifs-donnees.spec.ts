// 32 — objectifs issus des données (`objectifFields`) : les cibles sont lues
// dans une colonne du jeu de données (agrégée en moyenne, métrique dédiée) et
// non saisies en constantes. Barres pour les valeurs, ligne en tirets pour
// l'objectif, avec une entrée de légende par série renseignée.
import { test, expect } from '@playwright/test'
import { prepareChartPage } from '../helpers/test-fixture'
import { mockDataFairApi } from '../helpers/mock-api'
import { injectConfig, waitForChart } from '../helpers/inject-config'
import { setupCanvasTextCapture, type CapturedText } from '../helpers/canvas-text'
import { datasets, makeDatasetEntry } from '../fixtures/datasets'
import { configs } from '../fixtures/configs'
import { valuesAggFixtures } from '../fixtures/api-responses'

test('draws objectives read from the data as dashed lines', async ({ page }) => {
  await setupCanvasTextCapture(page)
  await prepareChartPage(page)
  await page.goto('/app/')
  const entry = configs['32-objectifs-donnees']
  const dataset = datasets[entry.dataset]
  const valuesAggRequests: URLSearchParams[] = []
  await mockDataFairApi(page, dataset.id, {
    valuesAgg: valuesAggFixtures.objectifs_bpe,
    valuesAggRequests
  })
  await injectConfig(page, { ...entry.config, datasets: [makeDatasetEntry(entry.dataset)] })
  await waitForChart(page)

  await expect(page.locator('canvas').first()).toBeVisible()
  await expect(page.locator('.v-empty-state')).toHaveCount(0)

  // la cible est demandée avec sa propre métrique, indépendamment du graphique
  expect(valuesAggRequests.some((p) => (p.get('extra_metrics') || '').includes('objectif_2030:avg'))).toBe(true)

  // laisser l'animation se terminer : la dernière frame capturée est stable
  await page.waitForTimeout(2000)
  const texts = await page.evaluate(() => (window as unknown as { __texts: CapturedText[] }).__texts)
  // une entrée de légende par série ayant un objectif ; la 3e série n'en a pas
  const labels = [...new Set(texts.map((t) => t.text).filter((t) => t.startsWith('Objectif 2030')))].sort()
  expect(labels).toEqual(['Objectif 2030 – PACA', 'Objectif 2030 – Île-de-France'])
})
