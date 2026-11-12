// 32 — targets from the data (`objectifFields`): the targets are read
// from a dataset column (averaged, dedicated metric) and
// not entered as constants. Bars for the values, dashed line for
// the target, with one legend entry per series that has one.
import type { CapturedText } from '../helpers/canvas-text'
import { test, expect } from '@playwright/test'
import { prepareChartPage } from '../helpers/test-fixture'
import { mockDataFairApi } from '../helpers/mock-api'
import { injectConfig, waitForChart } from '../helpers/inject-config'
import { setupCanvasTextCapture } from '../helpers/canvas-text'
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

  // the target is requested with its own metric, independently from the chart
  expect(valuesAggRequests.some((p) => (p.get('extra_metrics') || '').includes('objectif_2030:avg'))).toBe(true)

  // let the animation finish: the last captured frame is stable
  await page.waitForTimeout(2000)
  const texts = await page.evaluate(() => (window as unknown as { __texts: CapturedText[] }).__texts)
  // one legend entry per series with a target; the 3rd series has none
  const labels = [...new Set(texts.map((t) => t.text).filter((t) => t.startsWith('Objectif 2030')))].sort()
  expect(labels).toEqual(['Objectif 2030 – PACA', 'Objectif 2030 – Île-de-France'])
})
