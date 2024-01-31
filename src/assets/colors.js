import chroma from 'chroma-js'

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

// use a simple greyscale to complete color palettes, always better than a single grey color
function generateGreyscale(start, end, steps) {
  const greyscale = []
  for (let i = start; i <= end; i++) {
    const lightness = Math.round((i / steps) * 255)
    greyscale.push(`rgb(${lightness},${lightness},${lightness})`)
  }
  return greyscale
}

export default function getColors(colorscheme, size, vuetifyColors = null) {
  if (colorscheme.type === 'vuetify-theme' && vuetifyColors) {
    const baseColors = [vuetifyColors.primary, vuetifyColors.secondary]
    if (colorscheme.useAccent) {
      baseColors.push(vuetifyColors.accent)
    }

    if (colorscheme.generatePalette) {
      return generateDynamicPalette(baseColors, colorscheme.paletteType, size)
    } else {
      return baseColors.slice(0, size)
    }
  }

  const colors = generatePalette(colorscheme, size)
  if (colorscheme.reverse) colors.reverse()
  const greyscaleColors = generateGreyscale(5, 25, 30)
  return colors.concat(greyscaleColors)
}

function generateDynamicPalette(baseColors, paletteType, size) {
  let colors = []
  if (paletteType === 'hues') {
    const hues = []
    const effectiveSize = Math.min(size, 20)
    const length = Math.floor(effectiveSize / baseColors.length)
    baseColors.forEach(baseColor => {
      hues.push(generateHuesFromColor(baseColor, length + 1))
    })
    for (let i = 0; i < length + 1; i++) {
      hues.forEach(hue => {
        colors.push(hue[i])
      })
    }
  } else if (paletteType === 'complementary') {
    const generatedColors = []
    const effectiveSize = Math.min(size, 20)
    const length = Math.floor(effectiveSize / baseColors.length)
    baseColors.forEach(baseColor => {
      generatedColors.push(generatePaletteFromColor(baseColor, length + 1))
    })
    for (let i = 0; i < length + 1; i++) {
      generatedColors.forEach(color => {
        colors.push(color[i])
      })
    }
  }

  colors = [...new Set(colors)]
  if (colors.length > size) {
    colors = colors.slice(0, size)
  } else {
    const numGreyscaleColors = size - colors.length
    const start = 0
    const end = numGreyscaleColors - 1
    const steps = numGreyscaleColors
    const greyscaleColors = generateGreyscale(start, end, steps)
    colors = colors.concat(greyscaleColors)
  }

  return colors
}

/**
 * Generates a color palette based on the specified type and number of colors.
 *
 * @param {string} [colorscheme] - The colorscheme object to use. Contains both the type (qualitative or diverging) and the name of the colorscheme to use.
 * @param {number} [numColors=10] - The number of colors to include in the palette. Defaults to 10.
 * @returns {Array<string>} - An array of color values representing the generated palette.
 */
function generatePalette(colorscheme, numColors = 10) {
  let set
  if (colorscheme.type === 'qualitative') {
    const paletteSets = ['Set1', 'Set2', 'Set3', 'Dark2', 'Paired', 'Accent', 'Pastel1', 'Pastel2']
    set = paletteSets.includes(colorscheme.qualitativeName) ? colorscheme.qualitativeName : 'Dark2'
  } else if (colorscheme.type === 'diverging') {
    const paletteSets = ['BrBG', 'PRGn', 'PiYG', 'PuOr', 'RdBu', 'RdGy', 'RdYlBu', 'RdYlGn', 'Spectral']
    set = paletteSets.includes(colorscheme.divergingName) ? colorscheme.divergingName : 'RdYlGn'
  }
  return chroma.scale(set).mode('lch').colors(numColors)
}

/**
 * Generates a list of color hues based on a given base color.
 *
 * @param {string} colorHex - The hexadecimal representation of the base color.
 * @param {number} [numColors=10] - The number of color hues to generate.
 * @returns {string[]} An array of color hues in hexadecimal format.
 */
function generateHuesFromColor(colorHex, numColors = 10) {
  const baseColor = chroma(colorHex)
  const colors = [baseColor.hex()]
  for (let i = 1; i < numColors; i++) {
    const color = baseColor.set('hsl.l', '*' + (1 + i / numColors)).saturate(1)
    colors.push(color.hex())
  }

  return colors
}

/**
 * Generates a color palette based on a given base color.
 *
 * @param {string} colorHex - The base color in hexadecimal format.
 * @param {number} [numColors=10] - The number of colors to generate in the palette.
 * @returns {string[]} An array of colors in hexadecimal format representing the generated palette.
 */
function generatePaletteFromColor(colorHex, numColors = 10) {
  const baseColor = chroma(colorHex)
  let colors = [baseColor.hex()]

  const complementaryColor = baseColor.set('hsl.h', '+180')
  colors.push(complementaryColor.hex())

  for (let i = 1; i <= Math.floor((numColors - 2) / 2); i++) {
    const analogousColor1 = baseColor.set('hsl.h', `+${i * 30}`)
    const analogousColor2 = baseColor.set('hsl.h', `-${i * 30}`)
    colors.push(analogousColor1.hex(), analogousColor2.hex())
  }

  if (colors.length < numColors) {
    const triadicColor1 = baseColor.set('hsl.h', '+120')
    const triadicColor2 = baseColor.set('hsl.h', '-120')
    colors.push(triadicColor1.hex(), triadicColor2.hex())
  }

  colors = colors.slice(0, numColors)

  return colors
}
