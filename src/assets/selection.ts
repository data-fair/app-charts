// Convention de sélection inter-app : un clic sur une entité d'un graphique
// émet une clé `_c_`/`_d_` seule ; une clé qui vise le champ d'abscisse (le champ
// de sélection déclaré ici) est mise en évidence, jamais restreinte. Voir le
// skill `data-fair-app`, `references/filters-url-convention.md` § « Sélection ».
//
// Helpers purs (sans Vue), unit-testés.
import chroma from 'chroma-js'
import { parseSelectionValues, type SelectionTarget, type TargetFilter } from '@data-fair/lib-vue/selection.js'

/** Entité sélectionnable d'un graphique : les valeurs de son champ d'abscisse. */
export interface ChartSelectionTarget extends SelectionTarget {
  /** Champ du dataset portant les valeurs d'abscisse. */
  fieldKey: string
  /** Concept du vocabulaire standard porté par ce champ, si présent. */
  conceptId?: string
  datasetId: string
}

/**
 * Champ dont les valeurs servent d'abscisse (et donc d'entités sélectionnables),
 * ou `null` quand l'abscisse n'est pas une valeur de champ (colonnes en libellé,
 * buckets de date) : rien à sélectionner alors.
 */
export function resolveSelectionTarget (
  chart: { config?: any } | null | undefined,
  dataset: { id?: string } | null | undefined,
  fields: Record<string, any> | null | undefined
): ChartSelectionTarget | null {
  const config = chart?.config
  const mode = (config?.type || '').replace('Categories', '')
  let field: any
  if (mode === 'rowsBased') field = config.labelsField
  // groupBy date : le libellé est un bucket agrégé, pas la date d'une ligne
  else if (mode === 'aggsBased' && config.groupBy?.type !== 'date') field = config.groupBy?.field

  const fieldKey = (typeof field === 'string' ? field : field?.key) as string | undefined
  const datasetId = dataset?.id
  if (!fieldKey || !datasetId) return null
  return { fieldKey, conceptId: fields?.[fieldKey]?.['x-concept']?.id, datasetId }
}

/**
 * Clé du filtre de sélection : une valeur unique (`eq`), forme concept
 * (portable entre datasets) quand le champ en porte un, sinon forme
 * dataset-scopée. Une seule clé, comme le veut la convention.
 */
export function selectionFilterKey (target: ChartSelectionTarget): string {
  return target.conceptId
    ? `_c_${target.conceptId}_eq`
    : `_d_${target.datasetId}_${target.fieldKey}_eq`
}

/**
 * Valeurs d'abscisse désignées par les filtres de la cible, dans l'ordre de
 * l'URL. Seuls `eq`/`in` désignent des entités.
 */
export function selectionValues (filters: TargetFilter[]): string[] {
  const values: string[] = []
  for (const f of filters) {
    if (f.operator !== 'eq' && f.operator !== 'in') continue
    values.push(...(f.operator === 'in' ? parseSelectionValues(f.value) : [f.value]))
  }
  return values
}

/**
 * Sélection unique : le clic remplace la sélection courante (même une sélection
 * multiple reçue `_in` — on la ramène à la valeur cliquée) ; re-clic sur la
 * valeur déjà seule sélectionnée → sélection vide.
 */
export function nextSelectionValue (current: string[], value: string): string[] {
  return current.length === 1 && current[0] === value ? [] : [value]
}

const FADE_ALPHA = 0.25

function faded (color: unknown): unknown {
  if (typeof color !== 'string') return color
  try {
    const [r, g, b] = chroma(color).rgba()
    return `rgba(${r},${g},${b},${FADE_ALPHA})`
  } catch {
    return color
  }
}

/** Couleur de base (chaîne) d'un dataset pour l'élément `i`, par ordre de préférence. */
function firstColor (i: number, ...candidates: unknown[]): unknown {
  for (const c of candidates) {
    if (typeof c === 'string') return c
    if (Array.isArray(c) && typeof c[i] === 'string') return c[i]
  }
  return undefined
}

/**
 * Mise en évidence d'une sélection reçue : les éléments dont la valeur
 * d'abscisse (`data.rawLabels`, aligné sur `data.labels`) n'est pas
 * sélectionnée sont estompés (alpha 0.25). Sans effet tant qu'aucun élément
 * affiché n'est sélectionné (sélection visant une autre colonne, ou une valeur
 * hors du top N du graphique). Le transform n'est pas muté.
 *
 * `lineBased` (courbes/radars) estompe les points, la ligne garde sa couleur ;
 * les autres graphiques sont estompés sur le fond (dans un graphique mixte,
 * chaque dataset suit son propre type).
 *
 * `vue-chartjs` met à jour les datasets par `Object.assign` (il ne retire jamais
 * une clé absente du dataset de base) et Chart.js met en cache les options
 * résolues par élément tant qu'une option est scalaire : un `backgroundColor`
 * qui repasse de tableau à chaîne n'est pas réévalué (les barres restent
 * estompées). On garde donc un **type stable** en renvoyant toujours un tableau
 * par élément, sélection ou non. Idem pour `pointBackgroundColor` des courbes.
 */
export function applySelectionHighlight (data: any, selectedValues: string[], lineBased = false): any {
  const rawLabels = data?.rawLabels as (string | null)[] | null | undefined
  if (!rawLabels?.length) return data
  const selected = new Set(selectedValues || [])
  const isSelected = (i: number) => rawLabels[i] != null && selected.has(String(rawLabels[i]))
  const active = rawLabels.some((_, i) => isSelected(i))
  const style = (color: unknown, i: number) => (active && !isSelected(i) ? faded(color) : color)

  const datasets = data.datasets.map((dataset: any) => {
    // « Graphique mixte » : les séries en barres restent estompées sur le
    // fond, seules les courbes voient leurs points estompés
    if (lineBased && dataset.type !== 'bar') {
      const base = rawLabels.map((_, i) => firstColor(i, dataset.pointBackgroundColor, dataset.borderColor, dataset.backgroundColor))
      return { ...dataset, pointBackgroundColor: base.map((color, i) => style(color, i)) }
    }
    if (Array.isArray(dataset.backgroundColor)) {
      return { ...dataset, backgroundColor: dataset.backgroundColor.map((c: unknown, i: number) => style(c, i)) }
    }
    if (typeof dataset.backgroundColor === 'string') {
      return { ...dataset, backgroundColor: rawLabels.map((_, i) => style(dataset.backgroundColor, i)) }
    }
    return dataset
  })
  return { ...data, datasets }
}
