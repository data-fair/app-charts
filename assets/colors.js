const palette = require('google-palette')

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
  return colors
}
