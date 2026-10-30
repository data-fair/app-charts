// Transverse — i18n runtime health + site info fast path
// 1. zéro avertissement [intlify] pendant le rendu d'un chart avec pourcentages :
//    distingue « la portée est correcte » de « le repli sauve les meubles »
//    (cf. useChartOptions : useI18n({ useScope: 'global' }) pour les numberFormats).
// 2. window.__PUBLIC_SITE_INFO est posé par le mock de _public.js : la session ne
//    doit pas repasser par le chemin déprécié refreshSiteInfo.
import { test, expect } from '@playwright/test'
import { injectConfig, waitForChart } from '../helpers/inject-config'
import { mockDataFairApi } from '../helpers/mock-api'
import { prepareChartPage } from '../helpers/test-fixture'
import { datasets, makeDatasetEntry } from '../fixtures/datasets'
import { configs } from '../fixtures/configs'
import { valuesAggFixtures } from '../fixtures/api-responses'

const configName = '01-pie-alim-secteur'

test('no [intlify] console warnings while rendering percentages, and __PUBLIC_SITE_INFO is set', async ({ page }) => {
  const warnings: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'warning' || msg.type() === 'error') warnings.push(msg.text())
  })

  await prepareChartPage(page)
  await page.goto('/app/')

  const entry = configs[configName]
  const dataset = datasets[entry.dataset]
  await mockDataFairApi(page, dataset.id, { valuesAgg: valuesAggFixtures.pie_alim_secteur })
  await injectConfig(page, { ...entry.config, datasets: [makeDatasetEntry(entry.dataset)] })
  await waitForChart(page)

  // _public.js a bien été servi en JS exécutable : la session lit le global sans fetch
  const siteInfoSet = await page.evaluate(() => !!(window as any).__PUBLIC_SITE_INFO)
  expect(siteInfoSet).toBe(true)

  // le pie 01 porte display: both -> outlabels + pourcentages formatés via n(v, 'percent')
  const intlify = warnings.filter((w) => w.includes('[intlify]'))
  expect(intlify).toEqual([])
})

// 3. l'état vide (config incomplète) monte son icône au démarrage : les icônes
//    Vuetify sont en mdi-svg, un nom `mdi-*` serait posé comme path SVG et
//    produirait une erreur DOM `<path> attribute d`.
test('the empty state renders its MDI icon without DOM attribute errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })

  await prepareChartPage(page)
  await page.goto('/app/')
  await injectConfig(page, { chart: { type: 'line' } })

  await expect(page.locator('.v-empty-state')).toBeVisible()
  expect(await page.locator('.v-empty-state svg path').count()).toBeGreaterThan(0)
  expect(errors.filter((e) => e.includes('attribute d'))).toEqual([])
})
