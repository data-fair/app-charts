// Inter-app selection: a `_c_`/`_d_` key targeting the x-axis field (the declared
// selection field) is never a restriction (the visualization drops it from its
// requests), and a click on an entity emits only this key in the URL — without
// marker (convention data-fair-app/references/filters-url-convention.md
// § « Sélection »).
import type { Page } from '@playwright/test'
import type { MockMap } from '../helpers/mock-api'
import type { ConfigName } from '../fixtures/configs'
import { test, expect } from '@playwright/test'
import { prepareChartPage } from '../helpers/test-fixture'
import { injectConfig, waitForChart } from '../helpers/inject-config'
import { mockDataFairApi } from '../helpers/mock-api'
import { datasets, makeDatasetEntry } from '../fixtures/datasets'
import { configs } from '../fixtures/configs'
import { valuesAggFixtures } from '../fixtures/api-responses'

const BPE = datasets.bpe.id
// the BPE x-axis field `type` carries no concept: dataset-scoped form
const FILTER_KEY = `_d_${BPE}_type_eq`
// a selection no longer sets a marker: no `_s_` key anywhere
const noMarkerKeys = (params: URLSearchParams) => [...params.keys()].filter((k) => k.startsWith('_s_'))
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
 * Records, per draw frame of the main canvas (detected by `clearRect`),
 * the colors assigned to `ctx.fillStyle`. `__fills` remains the aggregate.
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
 * Clicks the bars in order until the value of the selection filter
 * changes compared to `previous` (`null` value = missing), and
 * returns the obtained value. `null` if no click moved the selection.
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

test('a selection on the abscissa field never restricts the chart API requests', async ({ page }) => {
  const requests: URLSearchParams[] = []
  await boot(
    page,
    { valuesAgg: valuesAggFixtures.bar_bpe_salles, valuesAggRequests: requests },
    `?${FILTER_KEY}=${encodeURIComponent('Cinéma')}`
  )
  expect(requests.length).toBeGreaterThan(0)
  for (const params of requests) {
    expect(params.get('type_eq')).toBeNull()
    expect(params.get('type_in')).toBeNull()
    expect([...params.keys()].filter((k) => k.startsWith('_d_'))).toEqual([])
  }
})

test('a received selection fades the entities it does not designate', async ({ page }) => {
  await setupFillCapture(page)
  await boot(page, { valuesAgg: valuesAggFixtures.bar_bpe_salles }, `?${FILTER_KEY}=${encodeURIComponent('Cinéma')}`)
  await page.waitForTimeout(1000)
  const fills = await page.evaluate(() => (window as unknown as { __frames: string[][] }).__frames.flat())
  // applySelectionHighlight dims the unselected bars (alpha 0.25)
  expect(fills.some((v) => /^rgba\(\d+,\d+,\d+,0\.25\)$/.test(v))).toBe(true)
})

test('the option is opt-in: without it a click emits nothing', async ({ page }) => {
  await boot(page, { valuesAgg: valuesAggFixtures.bar_bpe_salles })
  expect(await clickBarChanging(page, BANDS, null)).toBeNull()
  const params = new URL(page.url()).searchParams
  expect(params.get(FILTER_KEY)).toBeNull()
  expect(noMarkerKeys(params)).toEqual([])
})

test('clicking a bar emits the selection key alone, clicking again clears it', async ({ page }) => {
  await boot(page, { valuesAgg: valuesAggFixtures.bar_bpe_salles }, '', { selection: true })

  const first = await clickBarChanging(page, BANDS, null)
  expect(first, 'aucune barre touchée').not.toBeNull()
  const params = new URL(page.url()).searchParams
  expect(params.get(FILTER_KEY)).toBe(first!.value)
  expect(noMarkerKeys(params)).toEqual([])

  const again = await clickBarChanging(page, [first!.fx], first!.value)
  expect(again?.value).toBeNull()
  expect(new URL(page.url()).searchParams.get(FILTER_KEY)).toBeNull()
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

// chart.config.color: scalar background (string). Chart.js does not re-evaluate the
// per-element options when an option goes back from array to string, hence a
// background type kept as an array (applySelectionHighlight).
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

  // the last rendered frame must no longer contain a dimmed color
  const last = await page.evaluate(() => (window as unknown as { __frames: string[][] }).__frames.at(-1) ?? [])
  expect(last.length).toBeGreaterThan(0)
  expect(last.some((v) => /^rgba\(51,102,204,0\.25\)$/.test(v))).toBe(false)
})
