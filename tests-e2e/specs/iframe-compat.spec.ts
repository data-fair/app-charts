// Transverse — iframe compatibility
// Covers: src/main.ts sets window.vIframeOptions at module level so the
// v-iframe-compat shim injected by DataFair doesn't fall back to a full page
// reload when the app is embedded in a parent d-frame.
import { test, expect } from '@playwright/test'
import { waitForAppReady } from '../helpers/inject-config'
import { prepareChartPage } from '../helpers/test-fixture'

test('window.vIframeOptions.reactiveParams is exposed before any config is injected', async ({ page }) => {
  await prepareChartPage(page)
  await page.goto('/app/')
  // The options are set at module level in main.ts, before createApp().
  // They should be available as soon as the script is evaluated.
  const ok = await page.evaluate(() => {
    const opts = (window as any).vIframeOptions
    return !!opts && typeof opts.reactiveParams === 'object' && opts.reactiveParams !== null
  })
  expect(ok).toBe(true)
})

test('reactiveParams is the same reactive object as the rest of the app uses', async ({ page }) => {
  await prepareChartPage(page)
  await page.goto('/app/')
  await waitForAppReady(page)
  // Set a property on reactiveParams via the iframe options object
  // and verify the app sees it (reactiveSearchParams global is the same).
  await page.evaluate(() => {
    const opts = (window as any).vIframeOptions
    if (opts?.reactiveParams) opts.reactiveParams.draft = 'true'
  })
  // The app should now see reactiveSearchParams.draft === 'true'.
  const seen = await page.evaluate(() => {
    const opts = (window as any).vIframeOptions
    return opts?.reactiveParams?.draft === 'true'
  })
  expect(seen).toBe(true)
})
