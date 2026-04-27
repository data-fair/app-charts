<script setup lang="ts">
import Chart from './components/Chart.vue'
import SnackBar from './components/SnackBar.vue'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import { useConfig } from './composables/config'
import { ofetch } from 'ofetch'
import { filters2qs } from '@data-fair/lib-utils/filters'
import { normalizeFilters } from './assets/utils'
import { watch, nextTick, ref } from 'vue'

(window as any).vIframeOptions = { reactiveParams: reactiveSearchParams }

const { config, error } = useConfig()

const isUpdating = ref(false)

watch(() => config.value?.staticFilters, (staticFilters) => {
  if (isUpdating.value) return
  if (window.parent && reactiveSearchParams.draft === 'true' && staticFilters?.length && !config.value?.qsFilter) {
    isUpdating.value = true
    window.parent.postMessage({ type: 'set-config', content: { field: 'qsFilter', value: filters2qs(normalizeFilters(staticFilters)!) } }, '*')
    nextTick(() => { isUpdating.value = false })
  }
}, { immediate: true, deep: true })

if (reactiveSearchParams.draft === 'true') {
  watch(error, (message) => {
    if (message) ofetch((window as any).APPLICATION.href + '/error', { body: { message }, method: 'POST' })
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
