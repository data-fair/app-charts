/**
 * @param {string} input
 * @returns {{ r: string, g: string, b: string, a: string }}
 */
function parseColor(input) {
  const div = document.createElement('div')
  div.style.color = input
  document.body.appendChild(div)
  const m = getComputedStyle(div).color.match(/^rgb(a)?\((\d+),\s*(\d+),\s*(\d+)(,\s*(\d+.\d+))?\)$/)
  document.body.removeChild(div)
  if (m) return { r: m[2], g: m[3], b: m[4], a: m[6] ? m[6] : '1' }
  else throw new Error('Color not parsed')
}

/**
 * @param {string} color
 * @param {string | number} alpha
 * @returns {string}
 */
export function setAlpha(color, alpha) {
  const { r, g, b } = parseColor(color)
  return `rgba(${r},${g},${b},${alpha})`
}
