// Transverse — sync staticFilters -> staticFiltersParams (draft only)
// Covers: App.vue serializes the static filters as REST params (filters2params)
// and pushes them back to the DataFair parent via postMessage, so the
// config-schema getItems URLs can restrict the value lists and trigger the
// contextual cardinality of /schema?maxCardinality=12.
//
// The app is mounted inside an iframe: the existing e2e fixture loads /app/
// top-level, where window.parent === window and the sync is a no-op by design.
import { test, expect, type Page } from '@playwright/test'
import { prepareChartPage } from '../helpers/test-fixture'
import { mockDataFairApi } from '../helpers/mock-api'
import { datasets, makeDatasetEntry } from '../fixtures/datasets'
import { configs } from '../fixtures/configs'
import { valuesAggFixtures } from '../fixtures/api-responses'

const dataset = datasets.alim
const entry = configs['18-bar-alim-filtre-paris']
const baseConfig = { ...entry.config, datasets: [makeDatasetEntry('alim')] }
const PARIS_FILTER = [{ type: 'in', field: 'dep_name', values: ['Paris'] }]

// Mounts a second app instance in an iframe, with the outgoing message listener
// installed on the parent. A new page (and window) is created per test, so the
// captures never leak between tests.
async function mountAppInIframe (page: Page, draft: boolean) {
  await page.evaluate((draft) => {
    ;(window as any).__outgoing = []
    window.addEventListener('message', (event) => {
      ;(window as any).__outgoing.push(event.data)
    })
    const iframe = document.createElement('iframe')
    iframe.src = draft ? '/app/?draft=true' : '/app/'
    document.body.appendChild(iframe)
  }, draft)
  await page.waitForFunction(() => {
    const win = (document.querySelector('iframe') as HTMLIFrameElement | null)?.contentWindow
    const appEl = win?.document.querySelector('#app') as any
    return !!appEl?.__vue_app__ && !!(win as any)?.APPLICATION
  })
}

async function pushConfigToIframe (page: Page, config: Record<string, unknown>) {
  await page.evaluate((cfg) => {
    ;(document.querySelector('iframe') as HTMLIFrameElement).contentWindow!.postMessage({ type: 'set-config', content: { configuration: cfg } }, '*')
  }, config)
}

function syncedValues (page: Page) {
  return page.evaluate(() => ((window as any).__outgoing || [])
    .filter((message: any) => message?.content?.field === 'staticFiltersParams')
    .map((message: any) => message.content.value as string))
}

async function waitForSync (page: Page) {
  await page.waitForFunction(() => ((window as any).__outgoing || [])
    .some((message: any) => message?.content?.field === 'staticFiltersParams'))
}

async function bootPage (page: Page, url = '/app/') {
  await prepareChartPage(page)
  await page.goto(url)
  await mockDataFairApi(page, dataset.id, { valuesAgg: valuesAggFixtures.bar_alim_filtre_paris })
}

test('pushes staticFiltersParams (REST params) to the parent in draft mode', async ({ page }) => {
  await bootPage(page)
  await mountAppInIframe(page, true)
  await pushConfigToIframe(page, { ...baseConfig, staticFilters: PARIS_FILTER })
  await waitForSync(page)
  const value = (await syncedValues(page)).at(-1)!
  expect(Object.fromEntries(new URLSearchParams(value))).toEqual({ dep_name_in: 'Paris' })
})

test('clears staticFiltersParams when the filters are removed', async ({ page }) => {
  await bootPage(page)
  await mountAppInIframe(page, true)
  // DataFair echoes the pushed field back with the config: the clear only
  // pushes when the parent-held value is stale.
  await pushConfigToIframe(page, { ...baseConfig, staticFilters: [], staticFiltersParams: 'dep_name_in=Paris' })
  await waitForSync(page)
  expect((await syncedValues(page)).at(-1)).toBe('')
})

test('does not push again when the serialized value is unchanged', async ({ page }) => {
  await bootPage(page)
  await mountAppInIframe(page, true)
  await pushConfigToIframe(page, { ...baseConfig, staticFilters: PARIS_FILTER })
  await waitForSync(page)
  const count = (await syncedValues(page)).length
  await pushConfigToIframe(page, { ...baseConfig, staticFilters: PARIS_FILTER, staticFiltersParams: 'dep_name_in=Paris' })
  await page.waitForTimeout(500)
  expect((await syncedValues(page)).length).toBe(count)
})

test('does not push outside draft mode', async ({ page }) => {
  await bootPage(page)
  await mountAppInIframe(page, false)
  await pushConfigToIframe(page, { ...baseConfig, staticFilters: PARIS_FILTER })
  await page.waitForTimeout(700)
  expect(await syncedValues(page)).toEqual([])
})

test('does not push when the app is not embedded', async ({ page }) => {
  await bootPage(page, '/app/?draft=true')
  await page.evaluate(() => {
    ;(window as any).__outgoing = []
    window.addEventListener('message', (event) => {
      ;(window as any).__outgoing.push(event.data)
    })
  })
  await page.evaluate((cfg) => {
    window.postMessage({ type: 'set-config', content: { configuration: cfg } }, '*')
  }, { ...baseConfig, staticFilters: PARIS_FILTER })
  await page.waitForTimeout(700)
  expect(await syncedValues(page)).toEqual([])
})
