import { defineConfig, devices } from '@playwright/test'

const VITE_URL = 'http://localhost:4100'

export default defineConfig({
  testDir: './tests-e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',

  use: {
    baseURL: VITE_URL,
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],

  // The tests are fully self-contained:
  // - window.APPLICATION is injected via page.addInitScript() in helpers/test-fixture.ts
  // - DataFair API endpoints are mocked via page.route() in helpers/mock-api.ts
  // - Chart configuration is injected via postMessage('set-config') in helpers/inject-config.ts
  // Only Vite is needed to serve the app HTML/JS bundle.
  webServer: {
    command: 'npm run test:webserver',
    url: `${VITE_URL}/app/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  }
})
