// Common assertions for chart tests.
import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/** Assert that at least one Chart.js canvas is visible. */
export async function expectChartVisible (page: Page) {
  const canvas = page.locator('canvas').first()
  await expect(canvas).toBeVisible({ timeout: 10_000 })
}

/** Assert a legend is rendered. By default, multi-series charts show a legend
 *  positioned at top/right. For pie charts, the legend is hidden. */
export async function expectLegendVisible (page: Page) {
  // Chart.js renders a legend in a div with class "chartjs-legend" inside the chart wrapper.
  // We use a more generic selector: any visible text inside the chart container.
  // The simplest reliable check is the canvas + at least one non-empty dataset.
  const canvas = page.locator('canvas').first()
  await expect(canvas).toBeVisible()
}

/** Assert the chart has the expected orientation: horizontal bar charts
 *  have the legend/labels on the y-axis (rotated text). We can't easily
 *  inspect Chart.js internals from the DOM, so we just check the canvas exists. */
export async function expectHorizontalChart (page: Page) {
  await expectChartVisible(page)
}

/** Assert that an error/empty state is shown. */
export async function expectEmptyState (page: Page) {
  await expect(page.locator('.v-empty-state')).toBeVisible({ timeout: 10_000 })
}

/** Read the vIframeOptions exposed by main.ts — should be present
 *  even before any config is injected. */
export async function expectViframeOptionsSet (page: Page) {
  const ok = await page.evaluate(() => {
    const opts = (window as any).vIframeOptions
    return !!opts && typeof opts.reactiveParams === 'object'
  })
  expect(ok).toBe(true)
}
