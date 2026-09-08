<script setup lang="ts">
import Chart from './components/Chart.vue'
import DfUiNotif from '@data-fair/lib-vuetify/ui-notif.vue'
import { ofetch } from 'ofetch'
import { filters2qs } from '@data-fair/lib-utils/filters'
import { normalizeFilters } from './assets/utils'
import { watch } from 'vue'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import { useConfig } from './composables/config'

const { config, error, notifyConfigChange } = useConfig()

// Sync staticFilters -> qsFilter back to DataFair parent (draft mode only)
watch(() => config.value?.staticFilters, (staticFilters) => {
  if (window.parent !== window && reactiveSearchParams.draft === 'true' && staticFilters?.length) {
    const qsFilter = filters2qs(normalizeFilters(staticFilters as any) as any)
    if (!qsFilter && !config.value?.qsFilter) return
    if (qsFilter === config.value?.qsFilter) return
    notifyConfigChange('qsFilter', qsFilter)
  }
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
