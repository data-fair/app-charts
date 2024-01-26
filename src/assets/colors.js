import Color from 'color-js'
import palette from 'google-palette'

// use a simple greysacle to complete color palettes, always better than a single grey color
const greyscale = []
for (let i = 5; i < 25; i++) {
  greyscale.push(Color('#000000').setLightness(i / 30).toCSS())
}

export default (colorscheme, size) => {
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
  return colors.concat(greyscale)
}
