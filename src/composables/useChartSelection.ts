// Glue réactive de la sélection inter-app : elle branche le clic d'un graphique
// sur les helpers purs de `@/assets/selection` et sur l'URL.
// Voir le skill `data-fair-app`, `references/filters-url-convention.md`.
import { computed } from 'vue'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import { findTargetFilters } from '@data-fair/lib-vue/selection.js'
import { useConfig } from '@/composables/config'
import { resolveSelectionTarget, selectionFilterKey, selectionValues, nextSelectionValue } from '@/assets/selection'

export interface ChartSelection {
  /** Valeurs d'abscisse actuellement sélectionnées (sélection reçue ou propre). */
  selectedValues: () => string[]
  /** Handler Chart.js `options.onClick`. */
  onClick: (event: unknown, elements: Array<{ index: number }>) => void
}

export function useChartSelection (rawLabels: () => (string | null)[] | null | undefined): ChartSelection {
  const { config, chart, dataset, fields } = useConfig()

  const target = computed(() => resolveSelectionTarget(chart.value, dataset.value, fields.value))
  const selectedValues = computed(() => (target.value ? selectionValues(findTargetFilters(reactiveSearchParams, target.value)) : []))

  function onClick (_event: unknown, elements: Array<{ index: number }>) {
    if (!config.value?.selection || !target.value || !elements?.length) return
    const value = rawLabels()?.[elements[0].index]
    if (value == null || value === '') return

    const key = selectionFilterKey(target.value)
    // purge d'une éventuelle sélection multiple (`_in`) du même champ
    delete reactiveSearchParams[key.replace(/_eq$/, '_in')]
    const next = nextSelectionValue(selectedValues.value, String(value))
    if (next.length) reactiveSearchParams[key] = next[0]
    else delete reactiveSearchParams[key]
  }

  return { selectedValues: () => selectedValues.value, onClick }
}
