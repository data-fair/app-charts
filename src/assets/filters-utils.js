/**
 * @param {Record<string, any>} filter
 * @returns {string | null}
 */
export function filter2qs (filter) {
  if (!filter.type || filter.type === 'in') {
    if ([null, undefined, ''].includes(filter.values)) return null
    if (Array.isArray(filter.values) && filter.values.length === 0) return null
    return filter.values.map(/** @param {string} v */ v => `${encodeURIComponent(filter.field.key)}:"${encodeURIComponent(v)}"`).join(' OR ')
  } else if (filter.type === 'out') {
    if ([null, undefined, ''].includes(filter.values)) return null
    if (Array.isArray(filter.values) && filter.values.length === 0) return null
    return filter.values.map(/** @param {string} v */ v => `!(${encodeURIComponent(filter.field.key)}:"${encodeURIComponent(v)}")`).join(' AND ')
  } else if (filter.type === 'interval') {
    if (!filter.minValue || !filter.maxValue) return null
    return `${encodeURIComponent(filter.field.key)}:[${encodeURIComponent(filter.minValue)} TO ${encodeURIComponent(filter.maxValue)}]`
  }
  return null
}

/**
 * @param {Array<Record<string, any>>} filters
 * @returns {string | null}
 */
export function filters2qs (filters) {
  const queryString = filters
    .map(filter2qs)
    .filter(f => f !== null)
    .join(' AND ')

  return queryString ? `(${queryString})` : null
}
