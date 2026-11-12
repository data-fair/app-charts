// Unit tests — config-schema consistency: every « object » oneOf (variants
// of chart type, data preparation, group, colors,
// filters) must declare oneOfLayout.emptyData = true.
//
// Without this flag, json-layout does not remove the properties of the previous
// branch when switching variant: the remaining keys violate the
// additionalProperties: false of the new branch and the form shows
// « ne doit pas contenir de propriété additionnelle ».
import { test, expect } from '@playwright/test'
import schema from '../../public/config-schema.json' with { type: 'json' }

// An « object » oneOf is a oneOf carried by an object schema (type: object or
// properties). Enumeration oneOfs (strings with const) are not
// concerned: their value is replaced, not merged.
function objectOneOfPaths (node: unknown, path: string): string[] {
  if (!node || typeof node !== 'object') return []
  if (Array.isArray(node)) return node.flatMap((item, i) => objectOneOfPaths(item, `${path}[${i}]`))
  const record = node as Record<string, any>
  const paths: string[] = []
  if (record.oneOf && (record.type === 'object' || record.properties)) {
    paths.push(path)
  }
  for (const key of Object.keys(record)) {
    if (key === 'oneOfLayout') continue
    paths.push(...objectOneOfPaths(record[key], `${path}/${key}`))
  }
  return paths
}

test('every object oneOf declares oneOfLayout.emptyData', () => {
  const missing = objectOneOfPaths(schema, '').filter((path) => {
    const container = path.split('/').reduce<any>((node, key) => {
      if (!key) return node
      const match = key.match(/^(.*)\[(\d+)\]$/)
      if (match) return node[match[1]][Number(match[2])]
      return node[key]
    }, schema)
    return container.oneOfLayout?.emptyData !== true
  })
  expect(missing).toEqual([])
})
