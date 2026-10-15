// Glue réactive de la sélection inter-app (`_s_`) : elle branche le clic d'un
// graphique sur les helpers purs de `@/assets/selection` et sur l'URL.
// Voir le skill `data-fair-app`, `references/filters-url-convention.md`.
import { computed } from 'vue'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import { findSelectionFilters, selectionMarkerKey, selectionMarkerValue } from '@data-fair/lib-vue/selection-filters.js'
import { useConfig } from '@/composables/config'
import { selectionFilterKey, selectionValuesForTarget, nextSelectionValue, type SelectionTarget } from '@/assets/selection'

/**
 * Champ dont les valeurs servent d'abscisse (et donc d'entités sélectionnables),
 * ou `null` quand l'abscisse n'est pas une valeur de champ (colonnes en libellé,
 * buckets de date) : rien à sélectionner alors.
 */
function abscissaField (chart: { config?: any }): any {
  const config = chart?.config
  const mode = (config?.type || '').replace('Categories', '')
  if (mode === 'rowsBased') return config.labelsField
  if (mode === 'aggsBased') {
    // groupBy date : le libellé est un bucket agrégé, pas la date d'une ligne
    if (config.groupBy?.type === 'date') return null
    return config.groupBy?.field
  }
  return null
}

export interface ChartSelection {
  /** Valeurs d'abscisse actuellement sélectionnées (sélection reçue ou propre). */
  selectedValues: () => string[]
  /** Handler Chart.js `options.onClick`. */
  onClick: (event: unknown, elements: Array<{ index: number }>) => void
}

export function useChartSelection (rawLabels: () => (string | null)[] | null | undefined): ChartSelection {
  const { config, chart, dataset, fields } = useConfig()

  const target = computed<SelectionTarget | null>(() => {
    const field = abscissaField(chart.value)
    const fieldKey = (typeof field === 'string' ? field : field?.key) as string | undefined
    const datasetId = dataset.value?.id
    if (!fieldKey || !datasetId) return null
    return { fieldKey, conceptId: fields.value[fieldKey]?.['x-concept']?.id, datasetId }
  })

  const filters = computed(() => findSelectionFilters(reactiveSearchParams, dataset.value?.id))
  const selectedValues = computed(() => (target.value ? selectionValuesForTarget(filters.value, target.value) : []))

  function onClick (_event: unknown, elements: Array<{ index: number }>) {
    if (!config.value?.selection || !target.value || !elements?.length) return
    // sans identité d'application, pas de marqueur possible : un filtre non
    // marqué serait une restriction, on n'émet rien
    const markerValue = selectionMarkerValue(window.APPLICATION?.id)
    if (!markerValue) return
    const value = rawLabels()?.[elements[0].index]
    if (value == null || value === '') return

    const key = selectionFilterKey(target.value)
    const marker = selectionMarkerKey(key)
    // purge d'une éventuelle sélection multiple (`_in`) du même champ
    delete reactiveSearchParams[key.replace(/_eq$/, '_in')]
    const next = nextSelectionValue(selectedValues.value, String(value))
    if (next.length) {
      reactiveSearchParams[key] = next[0]
      reactiveSearchParams[marker] = markerValue
    } else {
      delete reactiveSearchParams[key]
      delete reactiveSearchParams[marker]
    }
  }

  return { selectedValues: () => selectedValues.value, onClick }
}
