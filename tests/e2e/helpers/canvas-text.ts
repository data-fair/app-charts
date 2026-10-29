// Capture des textes dessinés sur les canvas (titres d'axes, libellés
// d'annotations…) : les graphiques sont rendus en canvas, ces textes n'existent
// nulle part dans le DOM. Doit être appelé avant page.goto().
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
      // les titres d'axes sont pivotés : les coordonnées brutes ne veulent rien dire
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
