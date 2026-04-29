<script setup lang="ts">
import Chart from './components/Chart.vue'
import SnackBar from './components/SnackBar.vue'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import { useConfig } from './composables/config'
import { ofetch } from 'ofetch'
import { filters2qs } from '@data-fair/lib-utils/filters'
import { normalizeFilters } from './assets/utils'
import { watch } from 'vue'

window.vIframeOptions = { reactiveParams: reactiveSearchParams }

const { config, error } = useConfig()

watch(() => config.value?.staticFilters, (staticFilters) => {
  if (window.parent && reactiveSearchParams.draft === 'true' && staticFilters?.length) {
    const qsFilter = filters2qs(normalizeFilters(staticFilters as any) as any)
    if (!qsFilter && !config.value?.qsFilter) return
    if (qsFilter === config.value?.qsFilter) return
    window.parent.postMessage({ type: 'set-config', content: { field: 'qsFilter', value: qsFilter } }, '*')
  }
}, { immediate: true, deep: true })

if (reactiveSearchParams.draft === 'true') {
  watch(error, (message) => {
    if (message) ofetch(window.APPLICATION.href + '/error', { body: { message }, method: 'POST' })
  }, { immediate: true })
}
</script>

<template>
  <template v-if="!error">
    <Chart style="height:100%" />
    <snack-bar />
  </template>
  <v-empty-state
    v-else
    :title="error"
    headline="Configuration incomplète"
    icon="mdi-chart-bar"
  />
</template>
