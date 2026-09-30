// Unit tests — cohérence du config-schema : les URLs getItems qui listent des valeurs
// (values_agg) ou des colonnes à cardinalité réduite (/schema?maxCardinality) doivent
// relayer les filtres statiques via ${rootData.staticFiltersParams}. Ce champ caché est
// alimenté en draft par App.vue (filters2params) et permet à DataFair de recalculer la
// cardinalité dans le contexte des filtres et de restreindre les listes de valeurs.
import { test, expect } from '@playwright/test'
import schema from '../../public/config-schema.json' with { type: 'json' }

function getItemsUrls (node: unknown): string[] {
  if (!node || typeof node !== 'object') return []
  if (Array.isArray(node)) return node.flatMap(getItemsUrls)
  const record = node as Record<string, any>
  const urls = typeof record.url === 'string' ? [record.url] : []
  return urls.concat(...Object.values(record).map(getItemsUrls))
}

test('values_agg and maxCardinality getItems URLs carry staticFiltersParams', () => {
  const urls = getItemsUrls(schema).filter(url => url.includes('/values_agg?') || url.includes('maxCardinality=12'))
  expect(urls.length).toBe(12)
  const required = /\$\{rootData\.staticFiltersParams\}/
  const missing = urls.filter(url => !required.test(url))
  expect(missing).toEqual([])
})

test('staticFiltersParams is a hidden root property', () => {
  const props = (schema as any).allOf?.[0]?.properties
  expect(props?.staticFiltersParams).toMatchObject({ type: 'string', layout: 'none' })
})
