import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT ?? 3100)
const BASE_URL = `http://localhost:${PORT}`

// webServer est global à la config : le conditionner pour ne pas lancer Vite sur un
// run purement unitaire (plutôt que de scinder en deux fichiers). Playwright accepte
// `--project x` et `--project=x` : les deux formes doivent être lues.
const selectedProjects = process.argv.flatMap((arg, i) => {
  if (arg === '--project') return [process.argv[i + 1]]
  if (arg.startsWith('--project=')) return [arg.slice('--project='.length)]
  return []
})
const isUnitOnly = selectedProjects.length > 0 && selectedProjects.every(p => p === 'unit')

export default defineConfig({
  testMatch: /.*\.spec\.ts$/,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  outputDir: './tests/output',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure'
  },
  projects: [
    { name: 'unit', testDir: './tests/unit' },
    { name: 'e2e', testDir: './tests/e2e', use: { ...devices['Desktop Chrome'] } }
  ],
  // PUBLIC_URL est vidé dans la commande : protège d'un PUBLIC_URL exporté dans le
  // shell, qui casserait la base de Vite. APP_PORT est injecté par env (jamais par
  // --port, qui ne change pas hmr.port) ; DATA_FAIR_TEST marque un serveur de test.
  webServer: isUnitOnly
    ? undefined
    : {
        command: 'PUBLIC_URL= npm run dev-app',
        url: `${BASE_URL}/app/`,
        env: { ...process.env, APP_PORT: String(PORT), DATA_FAIR_TEST: 'true' },
        reuseExistingServer: !process.env.CI,
        timeout: 120_000
      }
})
