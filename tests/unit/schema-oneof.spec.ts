// Unit tests — cohérence du config-schema : chaque oneOf « objet » (variantes
// de type de graphique, de préparation des données, de groupe, de couleurs,
// de filtres) doit déclarer oneOfLayout.emptyData = true.
//
// Sans ce flag, json-layout ne supprime pas les propriétés de la branche
// précédente lors d'un changement de variante : les clés restantes violent le
// additionalProperties: false de la nouvelle branche et le formulaire affiche
// « ne doit pas contenir de propriété additionnelle ».
import { test, expect } from '@playwright/test'
import schema from '../../public/config-schema.json' with { type: 'json' }

// Un oneOf « objet » est un oneOf porté par un schéma objet (type: object ou
// des properties). Les oneOf d'énumération (chaînes avec const) ne sont pas
// concernés : leur valeur est remplacée, pas fusionnée.
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
