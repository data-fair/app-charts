import palette from 'google-palette'
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

/**
 * Generates a color palette based on the specified type and number of colors.
 *
 * @param {string} type - The type of color palette to generate. Possible values are 'Qualitative', 'Divergente', and 'Sequentielle'.
 * @param {number} [numColors=10] - The number of colors to include in the palette. Defaults to 10.
 * @returns {Array<string>} - An array of color values representing the generated palette.
 */
export function generatePalette(type, numColors = 10) {
  let scale
  switch (type) {
    case 'Qualitative':
      scale = chroma.scale('Set3').colors(numColors)
      break
    case 'Divergente':
      scale = chroma.scale(['red', 'white', 'blue']).mode('lch').colors(numColors)
      break
    case 'Sequentielle':
      scale = chroma.scale(['white', 'blue']).mode('lch').colors(numColors)
      break
    default:
      scale = chroma.scale('Set3').colors(numColors)
  }
  return scale
}

/**
 * Adjusts a color for color blindness.
 * Totally not perfect yet, currently just shifts the hue and reduces saturation.
 *
 * @param {string} colorHex - The hexadecimal representation of the color.
 * @returns {string} The adjusted color in hexadecimal format.
 */
function adjustForColorBlindness(colorHex) {
  let color = chroma(colorHex)
  // Example adjustment: shift hue and reduce saturation
  color = color.set('hsl.h', '+20').desaturate(0.5)
  return color.hex()
}

/**
 * Generates a list of color hues based on a given base color.
 *
 * @param {string} colorHex - The hexadecimal representation of the base color.
 * @param {boolean} [colorBlindFriendly=false] - Indicates whether the generated colors should be adjusted for color blindness.
 * @param {number} [numColors=10] - The number of color hues to generate.
 * @returns {string[]} An array of color hues in hexadecimal format.
 */
export function generateHuesFromColor(colorHex, colorBlindFriendly = false, numColors = 10) {
  const baseColor = chroma(colorHex)
  let colors = [baseColor.hex()]
  for (let i = 1; i < numColors; i++) {
    const color = baseColor.set('hsl.l', '*' + (1 + i / numColors)).saturate(1)
    colors.push(color.hex())
  }

  if (colorBlindFriendly) {
    colors = colors.map(c => adjustForColorBlindness(c))
  }

  return colors
}

/**
 * Generates a color palette based on a given base color.
 *
 * @param {string} colorHex - The base color in hexadecimal format.
 * @param {number} [numColors=10] - The number of colors to generate in the palette.
 * @param {boolean} [colorBlindFriendly=false] - Indicates whether the palette should be adjusted for color blindness.
 * @returns {string[]} An array of colors in hexadecimal format representing the generated palette.
 */
export function generatePaletteFromColor(colorHex, numColors = 10, colorBlindFriendly = false) {
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

  if (colorBlindFriendly) {
    colors = colors.map(c => adjustForColorBlindness(c))
  }

  return colors
}

/**
 * Simulates color blindness for a given color.
 *
 * @param {string} colorHex - The hexadecimal representation of the color.
 * @returns {Array} - An array of color hex values representing the simulated color blindness versions of the input color.
 */
export function simulateColorBlindness(colorHex) {
  const normalColor = chroma(colorHex)
  const cb = [normalColor.hex()]

  // Simulate Protanopia (red-weak): Shift green and preserve blue
  const protanopia = chroma(normalColor.get('rgb.g'), normalColor.get('rgb.b'), normalColor.get('rgb.b')).desaturate(1.2)
  cb.push(protanopia.hex())

  // Simulate Deuteranopia (green-weak): Shift red and preserve blue
  const deuteranopia = chroma(normalColor.get('rgb.r'), normalColor.get('rgb.b'), normalColor.get('rgb.b')).desaturate(1.2)
  cb.push(deuteranopia.hex())

  // Simulate Tritanopia (blue-weak): Shift red and green, reduce blue
  const tritanopia = chroma(normalColor.get('rgb.r'), normalColor.get('rgb.g'), Math.max(normalColor.get('rgb.b') - 80, 0)).desaturate(1.2)
  cb.push(tritanopia.hex())

  // Simulate Achromatopsia (black & white)
  const achromatopsia = chroma(normalColor.get('luminance'), normalColor.get('luminance'), normalColor.get('luminance'))
  cb.push(achromatopsia.hex())

  return cb
}

/**
 * Beautifies a palette of colors using chroma-js library.
 * Source for the ideas : https://gka.github.io/palettes/#/9|s|00429d,96ffea,ffffe0|ffffe0,ff005e,93003a|1|1
 * Might look further into this "configuration"
 *
 * @param {Array} colors - The array of colors to be beautified.
 * @returns {Array} - The beautified array of colors.
 */
export function beautifyPalette(colors) {
  const bezier = chroma.bezier(colors)
  const bezierColors = bezier.scale().correctLightness().colors(colors.length)
  return bezierColors
}

/**
 * Returns a golden color based on the input color.
 * The idea of "golden color" is taken from the golden ratio.
 * As seen on pleasejs : https://github.com/Fooidge/PleaseJS?tab=readme-ov-file#make_color-options
 *
 * @param {string} color - The input color in any valid CSS color format.
 * @returns {string} - The golden color in hexadecimal format.
 */
export function getGoldenColor(color) {
  const goldenRatio = 0.618033988749895
  const hue = chroma(color).hsl()[0]
  const hueGolden = (hue + (goldenRatio / 360)) % 360
  return chroma.hsl(hueGolden, 0.75, 0.5).hex()
}
