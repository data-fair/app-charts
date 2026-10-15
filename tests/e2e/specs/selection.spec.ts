// Sélection inter-app (`_s_`) : un filtre marqué reçu n'est jamais une
// restriction (getConceptFilters l'écarte des requêtes), et un clic sur une
// entité émet le filtre + son marqueur dans l'URL (convention
// data-fair-app/references/filters-url-convention.md § « Mode sélection `_s_` »).
import { test, expect, type Page } from '@playwright/test'
import { prepareChartPage } from '../helpers/test-fixture'
import { injectConfig, waitForChart } from '../helpers/inject-config'
import { mockDataFairApi, type MockMap } from '../helpers/mock-api'
import { datasets, makeDatasetEntry } from '../fixtures/datasets'
import { configs, type ConfigName } from '../fixtures/configs'
import { valuesAggFixtures } from '../fixtures/api-responses'

const BPE = datasets.bpe.id
// le champ d'abscisse `type` de la BPE ne porte pas de concept : forme dataset-scopée
const FILTER_KEY = `_d_${BPE}_type_eq`
const MARKER_KEY = `_s_${BPE}_type`
const BANDS = [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]

function fullConfig (name: ConfigName, extra: Record<string, unknown> = {}) {
  const entry = configs[name]
  return { ...entry.config, ...extra, datasets: [makeDatasetEntry(entry.dataset)] }
}

async function boot (page: Page, mocks: MockMap, query = '', extra: Record<string, unknown> = {}) {
  await prepareChartPage(page)
  await page.goto('/app/' + query)
  await mockDataFairApi(page, BPE, mocks)
  await injectConfig(page, fullConfig('10-bar-bpe-salles', extra))
  await waitForChart(page)
}

/**
 * Enregistre, par frame de dessin du canvas principal (repérée par `clearRect`),
 * les couleurs assignées à `ctx.fillStyle`. `__fills` reste l'agrégat.
 */
function setupFillCapture (page: Page) {
  return page.addInitScript(() => {
    const w = window as unknown as { __frames: string[][], __fills: string[], __mainCanvas?: HTMLCanvasElement }
    w.__frames = []
    w.__fills = []
    const proto = CanvasRenderingContext2D.prototype
    const originalClearRect = proto.clearRect
    proto.clearRect = function (this: CanvasRenderingContext2D, ...args: [number, number, number, number]) {
      if (!w.__mainCanvas) w.__mainCanvas = (document.querySelector('canvas') as HTMLCanvasElement) || this.canvas
      if (this.canvas === w.__mainCanvas) w.__frames.push([])
      return originalClearRect.apply(this, args)
    }
    const desc = Object.getOwnPropertyDescriptor(proto, 'fillStyle')!
    Object.defineProperty(proto, 'fillStyle', {
      set (this: CanvasRenderingContext2D, value: string) {
        if (typeof value === 'string' && this.canvas === w.__mainCanvas) {
          w.__fills.push(value)
          const frame = w.__frames[w.__frames.length - 1]
          if (frame) frame.push(value)
        }
        desc.set!.call(this, value)
      },
      get (this: CanvasRenderingContext2D) {
        return desc.get!.call(this)
      }
    })
  })
}

/**
 * Clique les bandes dans l'ordre jusqu'à ce que la valeur du filtre de
 * sélection change par rapport à `previous` (valeur `null` = absente), et
 * renvoie la valeur obtenue. `null` si aucun clic n'a fait bouger la sélection.
 */
async function clickBarChanging (page: Page, fractions: number[], previous: string | null) {
  const box = await page.locator('canvas').first().boundingBox()
  if (!box) throw new Error('canvas introuvable')
  for (const fx of fractions) {
    await page.mouse.click(box.x + box.width * fx, box.y + box.height * 0.85)
    await page.waitForTimeout(700)
    const value = new URL(page.url()).searchParams.get(FILTER_KEY)
    if (value !== previous) return { fx, value }
  }
  return null
}

test('a marked (`_s_`) selection never restricts the chart API requests', async ({ page }) => {
  const requests: URLSearchParams[] = []
  await boot(
    page,
    { valuesAgg: valuesAggFixtures.bar_bpe_salles, valuesAggRequests: requests },
    `?${FILTER_KEY}=${encodeURIComponent('Cinéma')}&${MARKER_KEY}=page_x`
  )
  expect(requests.length).toBeGreaterThan(0)
  for (const params of requests) {
    expect(params.get('type_eq')).toBeNull()
    expect(params.get('type_in')).toBeNull()
    expect([...params.keys()].filter((k) => k.startsWith('_s_') || k.startsWith('_d_'))).toEqual([])
  }
})

test('a received selection fades the entities it does not designate', async ({ page }) => {
  await setupFillCapture(page)
  await boot(page, { valuesAgg: valuesAggFixtures.bar_bpe_salles }, `?${FILTER_KEY}=${encodeURIComponent('Cinéma')}&${MARKER_KEY}=page_x`)
  await page.waitForTimeout(1000)
  const fills = await page.evaluate(() => (window as unknown as { __frames: string[][] }).__frames.flat())
  // applySelectionHighlight estompe les barres non sélectionnées (alpha 0.25)
  expect(fills.some((v) => /^rgba\(\d+,\d+,\d+,0\.25\)$/.test(v))).toBe(true)
})

test('the option is opt-in: without it a click emits nothing', async ({ page }) => {
  await boot(page, { valuesAgg: valuesAggFixtures.bar_bpe_salles })
  expect(await clickBarChanging(page, BANDS, null)).toBeNull()
  expect(new URL(page.url()).searchParams.get(MARKER_KEY)).toBeNull()
})

test('clicking a bar emits the selection, clicking again clears it', async ({ page }) => {
  await boot(page, { valuesAgg: valuesAggFixtures.bar_bpe_salles }, '', { selection: true })

  const first = await clickBarChanging(page, BANDS, null)
  expect(first, 'aucune barre touchée').not.toBeNull()
  const params = new URL(page.url()).searchParams
  expect(params.get(FILTER_KEY)).toBe(first!.value)
  expect(params.get(MARKER_KEY)?.startsWith('app_')).toBe(true)

  const again = await clickBarChanging(page, [first!.fx], first!.value)
  expect(again?.value).toBeNull()
  expect(new URL(page.url()).searchParams.get(MARKER_KEY)).toBeNull()
})

test('clicking another bar replaces the selection (single eq value)', async ({ page }) => {
  await boot(page, { valuesAgg: valuesAggFixtures.bar_bpe_salles }, '', { selection: true })
  const first = await clickBarChanging(page, [0.2, 0.3, 0.4], null)
  expect(first?.value).toBeTruthy()
  const second = await clickBarChanging(page, [0.7, 0.8, 0.6], first!.value)
  expect(second?.value).toBeTruthy()
  expect(second!.value).not.toBe(first!.value)
  expect(second!.value).not.toContain(',')
})

// chart.config.color : fond scalaire (chaîne). Chart.js ne réévalue pas les
// options par élément quand une option repasse de tableau à chaîne, d'où un
// type de fond maintenu en tableau (applySelectionHighlight).
test('deselecting restores the full opacity of a single-color bar chart', async ({ page }) => {
  await setupFillCapture(page)
  const entry = configs['10-bar-bpe-salles']
  await boot(page, { valuesAgg: valuesAggFixtures.bar_bpe_salles }, '', {
    selection: true,
    chart: { ...entry.config.chart, config: { ...entry.config.chart.config, color: { type: 'custom', hexValue: '#3366cc' } } }
  })

  const first = await clickBarChanging(page, BANDS, null)
  expect(first?.value).toBeTruthy()
  expect((await clickBarChanging(page, [first!.fx], first!.value))?.value).toBeNull()
  await page.waitForTimeout(400)

  // la dernière frame rendue ne doit plus contenir de couleur estompée
  const last = await page.evaluate(() => (window as unknown as { __frames: string[][] }).__frames.at(-1) ?? [])
  expect(last.length).toBeGreaterThan(0)
  expect(last.some((v) => /^rgba\(51,102,204,0\.25\)$/.test(v))).toBe(false)
})
