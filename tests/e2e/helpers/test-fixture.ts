// Lightweight helper to set up a test for a specific config.
// Usage:
//   import { expect, setupChartTest } from '../helpers/test-fixture'
//   const test = setupChartTest('01-pie-alim-secteur', { valuesAgg: fixture })
//   test('renders', async ({ chartPage }) => { ... })
import { test as base, expect as baseExpect, type Page } from '@playwright/test'
import { injectConfig, waitForChart } from './inject-config'
import { mockDataFairApi, mockSimpleDirectory, type MockMap } from './mock-api'
import { datasets, makeDatasetEntry } from '../fixtures/datasets'
import { configs, type ConfigName } from '../fixtures/configs'

export const expect = baseExpect

export interface ChartPageFixture {
  chartPage: Page
}

// Register the mocks + addInitScript that the test page needs in order to
// fully boot the app without an external dev server. Call this BEFORE
// page.goto(). Transverse tests (that don't use setupChartTest) can also
// call it directly to share the same setup.
//
// The APPLICATION stub mirrors what df-dev-server normally injects via the
// %APPLICATION% placeholder in index.html. URLs are derived from the actual
// page origin so the tests stay port-agnostic (E2E_PORT from the .env).
export async function prepareChartPage (page: Page) {
  await page.addInitScript(() => {
    const origin = window.location.origin
    ;(window as any).APPLICATION = {
      id: 'dev-application',
      title: 'Dev application',
      configuration: {},
      exposedUrl: `${origin}/app`,
      href: `${origin}/config`,
      apiUrl: `${origin}/api/v1`,
      wsUrl: `ws://${window.location.host}/ws`
    }
  })
  await mockSimpleDirectory(page)
}

export function setupChartTest (configName: ConfigName, mocks: MockMap = {}) {
  const entry = configs[configName]
  const dataset = datasets[entry.dataset]
  const fullConfig = { ...entry.config, datasets: [makeDatasetEntry(entry.dataset)] }

  return base.extend<ChartPageFixture>({
    chartPage: async ({ page }, use) => {
      await prepareChartPage(page)
      await page.goto('/app/')
      await mockDataFairApi(page, dataset.id, mocks)
      await injectConfig(page, fullConfig)
      await waitForChart(page)
      await use(page)
    }
  })
}
