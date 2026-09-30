<script setup lang="ts">
import Chart from './components/Chart.vue'
import DfUiNotif from '@data-fair/lib-vuetify/ui-notif.vue'
import { ofetch } from 'ofetch'
import { watch } from 'vue'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import type { Filter } from '@data-fair/lib-utils/filters/index.js'
import { useConfig } from './composables/config'
import { staticFiltersParams } from './assets/utils'

const { config, error, notifyConfigChange } = useConfig()

// Sync staticFilters -> staticFiltersParams back to DataFair parent (draft mode only).
// The config-schema getItems URLs consume it to filter the value lists and to trigger
// the contextual cardinality of /schema?maxCardinality=12.
watch(() => config.value?.staticFilters, (staticFilters) => {
  if (window.parent === window || reactiveSearchParams.draft !== 'true') return
  const params = staticFiltersParams(staticFilters as Filter[] | undefined)
  if (params === (config.value?.staticFiltersParams ?? '')) return
  notifyConfigChange('staticFiltersParams', params)
}, { immediate: true, deep: true })

// Report config errors to DataFair in draft mode
if (reactiveSearchParams.draft === 'true') {
  watch(error, (message) => {
    if (message) ofetch(window.APPLICATION.href + '/error', { body: { message }, method: 'POST' })
  }, { immediate: true })
}

// service de capture : sur erreur de configuration, rien d'autre ne signalera le
// rendu (pas de chart) — capturer l'état d'erreur plutôt que d'attendre le timeout
watch(error, (message) => {
  if (message && window.triggerCapture) window.triggerCapture(false)
}, { immediate: true })
</script>

<template>
  <template v-if="!error">
    <Chart style="height:100%" />
  </template>
  <v-empty-state
    v-else
    :title="error"
    headline="Configuration incomplète"
    icon="mdi-chart-bar"
  />
  <DfUiNotif />
</template>
