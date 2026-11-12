// Capture of the texts drawn on canvases (axis titles, annotation
// labels…): charts are rendered on canvas, these texts exist
// nowhere in the DOM. Must be called before page.goto().
import type { Page } from '@playwright/test'

export interface CapturedText {
  text: string
  x: number
  canvasWidth: number
}

export function setupCanvasTextCapture (page: Page) {
  return page.addInitScript(() => {
    const w = window as unknown as { __texts: CapturedText[] }
    w.__texts = []
    const proto = CanvasRenderingContext2D.prototype
    const original = proto.fillText
    proto.fillText = function (text: string, x: number, y: number, maxWidth?: number) {
      // axis titles are rotated: raw coordinates mean nothing
      const transform = this.getTransform()
      w.__texts.push({
        text: String(text),
        x: transform.a * x + transform.c * y + transform.e,
        canvasWidth: this.canvas.width
      })
      return maxWidth === undefined ? original.call(this, text, x, y) : original.call(this, text, x, y, maxWidth)
    }
  })
}
