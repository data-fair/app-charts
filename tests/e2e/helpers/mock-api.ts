// Helpers to mock DataFair API endpoints via Playwright route interception.
// We intercept all calls matching the dataset API base path and return
// fixtures from ./fixtures/api-responses.ts. This makes tests fast and
// deterministic, with no dependency on the live koumoul.com service.
import type { Page, Route } from '@playwright/test'
import * as api from '../fixtures/api-responses'

// Per-test registry of which fixture to return for which URL pattern.
// Tests register fixtures with mockDataFairApi() before sending the config.
export interface MockMap {
  valuesAgg?: any // single fixture for /values_agg
  valuesAggPerKey?: Record<string, any> // keyed by `field=...&` substring match
  valuesLabels?: any
  lines?: any
  metrics?: Record<string, { metric: number }> // per-field /metric_agg responses
}

export async function mockDataFairApi (page: Page, datasetId: string, mocks: MockMap = {}) {
  await page.route(`**/api/v1/datasets/${datasetId}/**`, async (route: Route) => {
    const url = new URL(route.request().url())
    const path = url.pathname
    const params = url.searchParams

    // /values_agg
    if (path.endsWith('/values_agg')) {
      if (mocks.valuesAgg) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mocks.valuesAgg) })
      }
      // Per-key match (groupBy field)
      if (mocks.valuesAggPerKey) {
        for (const [key, fixture] of Object.entries(mocks.valuesAggPerKey)) {
          if (url.search.includes(key)) {
            return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture) })
          }
        }
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(api.emptyAggs) })
    }

    // /values-labels/<field>
    const vlMatch = path.match(/\/values-labels\/([^/?]+)/)
    if (vlMatch) {
      const body = mocks.valuesLabels || []
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
    }

    // /lines
    if (path.endsWith('/lines')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mocks.lines || api.emptyResults) })
    }

    // /metric_agg (aggsLabels: N parallel calls)
    if (path.endsWith('/metric_agg')) {
      const field = params.get('field')
      if (field && mocks.metrics && mocks.metrics[field]) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mocks.metrics[field]) })
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(api.emptyMetric) })
    }

    // /schema (used by the schema `getItems` for select fields - we don't need to mock)
    if (path.endsWith('/schema')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    }

    // /schema?<query> variants
    if (path.includes('/schema')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    }

    // Catch-all: 404
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' })
  })
}

// Mocks the /simple-directory endpoints used by createSession() in main.ts.
//
// _public.js is served as application/javascript: it sets window.__PUBLIC_SITE_INFO,
// which createSession reads without any request. Without this mock the script would
// fall through to Vite's SPA fallback (200 text/html, broken JS) and the session
// would silently fall back to the deprecated refreshSiteInfo fetch on _public.
// The _public JSON endpoint is kept as a fallback mock for that deprecated path.
//
// The site info shape is the minimum required by lib-vue's getSession() and
// lib-vuetify's vuetifySessionOptions(): a plain object with an empty `theme`
// so that session.site.value is set and colors fall back to the defaults.
export async function mockSimpleDirectory (page: Page) {
  const siteInfo = { theme: { colors: {} } }
  await page.route('**/simple-directory/api/sites/_public.js', async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `window.__PUBLIC_SITE_INFO = ${JSON.stringify(siteInfo)}`
    })
  })
  await page.route('**/simple-directory/api/sites/_public', async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(siteInfo)
    })
  })
  // /simple-directory/api/sites/_theme.css: CSS file linked in index.html.
  // The dev server normally provides it; with plain Vite it 404s, which
  // is harmless but the network request is unnecessary in tests.
  await page.route('**/simple-directory/api/sites/_theme.css', async (route: Route) => {
    return route.fulfill({ status: 200, contentType: 'text/css', body: '' })
  })
}

/** Convenience: mock only the values_agg endpoint (the most common case). */
export async function mockValuesAgg (page: Page, datasetId: string, fixture: any) {
  return mockDataFairApi(page, datasetId, { valuesAgg: fixture })
}
