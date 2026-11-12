// Transverse — i18n runtime health + site info fast path
// 1. zero [intlify] warning while rendering a chart with percentages:
//    tells « the scope is correct » from « the fallback saves the day »
//    (see useChartOptions: useI18n({ useScope: 'global' }) for the numberFormats).
// 2. window.__PUBLIC_SITE_INFO is set by the _public.js mock: the session must
//    not go through the deprecated refreshSiteInfo path again.
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

  // _public.js was indeed served as executable JS: the session reads the global without fetch
  const siteInfoSet = await page.evaluate(() => !!(window as any).__PUBLIC_SITE_INFO)
  expect(siteInfoSet).toBe(true)

  // pie 01 has display: both -> outlabels + percentages formatted via n(v, 'percent')
  const intlify = warnings.filter((w) => w.includes('[intlify]'))
  expect(intlify).toEqual([])
})

// 3. the empty state (incomplete config) mounts its icon at startup: Vuetify
//    icons are mdi-svg, an `mdi-*` name would be set as an SVG path and
//    produce a DOM error `<path> attribute d`.
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
