// Transverse — bar value labels (hideYAxis): a label centered
// in a stacked segment too small to contain it must not overlap
// the one of a neighboring segment (display: 'auto' of chartjs-plugin-datalabels).
// The canvas render is observed by instrumenting clearRect (one draw frame
// per clear) and fillText (position, font and metrics of each text):
// the boxes of the bold numeric labels of the last frame are then
// compared pairwise.
import type { Page } from '@playwright/test'
import { test, expect } from '@playwright/test'
import { prepareChartPage } from '../helpers/test-fixture'
import { mockDataFairApi } from '../helpers/mock-api'
import { injectConfig, waitForChart } from '../helpers/inject-config'
import { datasets, makeDatasetEntry } from '../fixtures/datasets'
import { configs } from '../fixtures/configs'

// Two stacked regions public/private/associative/other: the last three
// segments have a tiny value, their centered labels overlap
// without automatic hiding.
const stackedWithTinySegments = {
  aggs: [
    {
      value: 'Région A',
      aggs: [
        { value: 'Public', total: 500 },
        { value: 'Privé', total: 1 },
        { value: 'Associatif', total: 1 },
        { value: 'Autre', total: 1 }
      ]
    },
    {
      value: 'Région B',
      aggs: [
        { value: 'Public', total: 300 },
        { value: 'Privé', total: 1 },
        { value: 'Associatif', total: 1 },
        { value: 'Autre', total: 1 }
      ]
    }
  ]
}

interface CapturedText {
  text: string
  x: number
  y: number
  font: string
  align: CanvasTextAlign
  width: number
  ascent: number
  descent: number
}

function setupCanvasTextCapture (page: Page) {
  return page.addInitScript(() => {
    const w = window as unknown as { __textFrames: CapturedText[][] }
    w.__textFrames = []
    const proto = CanvasRenderingContext2D.prototype
    const originalClearRect = proto.clearRect
    proto.clearRect = function (...args: [number, number, number, number]) {
      w.__textFrames.push([])
      return originalClearRect.apply(this, args)
    }
    const originalFillText = proto.fillText
    proto.fillText = function (text: string, x: number, y: number, maxWidth?: number) {
      const frame = w.__textFrames[w.__textFrames.length - 1]
      if (frame) {
        const metrics = this.measureText(text)
        const transform = this.getTransform()
        // real canvas coordinates: the plugin translates the context before fillText
        frame.push({
          text: String(text),
          x: transform.a * x + transform.c * y + transform.e,
          y: transform.b * x + transform.d * y + transform.f,
          font: this.font,
          align: this.textAlign,
          width: metrics.width * Math.abs(transform.a),
          ascent: (metrics.actualBoundingBoxAscent ?? 0) * Math.abs(transform.d),
          descent: (metrics.actualBoundingBoxDescent ?? 0) * Math.abs(transform.d)
        })
      }
      return maxWidth === undefined
        ? originalFillText.call(this, text, x, y)
        : originalFillText.call(this, text, x, y, maxWidth)
    }
  })
}

test('value labels of tiny stacked segments do not overlap', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 500 })
  await setupCanvasTextCapture(page)
  await prepareChartPage(page)
  await page.goto('/app/')
  const entry = configs['06-multi-bar-bpe-secteur']
  const dataset = datasets[entry.dataset]
  await mockDataFairApi(page, dataset.id, { valuesAgg: stackedWithTinySegments })
  await injectConfig(page, {
    ...entry.config,
    chart: { ...entry.config.chart, hideYAxis: true },
    datasets: [makeDatasetEntry(entry.dataset)]
  })
  await waitForChart(page)
  // let the animation finish: the last captured frame is stable
  await page.waitForTimeout(2000)

  const result = await page.evaluate(() => {
    const w = window as unknown as { __textFrames: CapturedText[][] }
    const frame = w.__textFrames[w.__textFrames.length - 1] ?? []
    // value labels: only bold numeric texts (axis titles and the
    // legend are not bold, the chart title is not numeric)
    const boxes = frame
      .filter(t => /bold/.test(t.font) && /\d/.test(t.text))
      .map(t => {
        const left = t.align === 'center' ? t.x - t.width / 2 : t.align === 'end' ? t.x - t.width : t.x
        return { left, right: left + t.width, top: t.y - t.ascent, bottom: t.y + t.descent }
      })
    let overlaps = 0
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]
        const b = boxes[j]
        if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) overlaps++
      }
    }
    return { labels: boxes.length, overlaps }
  })

  expect(result.labels).toBeGreaterThan(0)
  expect(result.overlaps).toBe(0)
})
