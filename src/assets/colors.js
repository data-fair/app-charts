import palette from 'google-palette'

function parseColor(input) {
  const div = document.createElement('div')
  div.style.color = input
  document.body.appendChild(div)
  const m = getComputedStyle(div).color.match(/^rgb(a)?\((\d+),\s*(\d+),\s*(\d+)(,\s*(\d+.\d+))?\)$/)
  document.body.removeChild(div)
  if (m) return { r: m[2], g: m[3], b: m[4], a: m[6] ? m[6] : '1' }
  else throw new Error('Color not parsed')
}

export function setAlpha(color, alpha) {
  const { r, g, b } = parseColor(color)
  return `rgba(${r},${g},${b},${alpha})`
}

export function darkenByRatio(color, ratio) {
  const { r, g, b, a } = parseColor(color)
  const darken = value => Math.round(value * (1 - ratio))
  return `rgba(${darken(r)},${darken(g)},${darken(b)},${a})`
}

// use a simple greyscale to complete color palettes, always better than a single grey color
function generateGreyscale(start, end, steps) {
  const greyscale = []
  for (let i = start; i <= end; i++) {
    const lightness = Math.round((i / steps) * 255)
    greyscale.push(`rgb(${lightness},${lightness},${lightness})`)
  }
  return greyscale
}

export default function getColors(colorscheme, size) {
  const typeMax = {
    qualitative: 8,
    diverging: 11,
    sequential: 9
  }
  let offset = 0
  if (colorscheme.subset && colorscheme.subset !== 'all') offset = typeMax[colorscheme.type] - size
  let colors = palette('cb-' + colorscheme.name, Math.min(size + offset, typeMax[colorscheme.type])).map(c => '#' + c)
  if (offset > 0) {
    if (colorscheme.subset === 'light') colors = colors.slice(0, colors.length - offset)
    if (colorscheme.subset === 'dark') colors = colors.slice(offset)
  }
  if (colorscheme.reverse) colors.reverse()
  const greyscaleColors = generateGreyscale(5, 25, 30)
  return colors.concat(greyscaleColors)
}
