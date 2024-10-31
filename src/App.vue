<script setup>
import Chart from './components/Chart.vue'
import SnackBar from './components/SnackBar.vue'
import reactiveSearchParams from '@data-fair/lib/vue/reactive-search-params-global.js'
import useAppInfo from './composables/useAppInfo'
import { ofetch } from 'ofetch'
import { filters2qs } from '@data-fair/lib/filters.js'

// @ts-ignore
window.vIframeOptions = { reactiveParams: reactiveSearchParams }

let /** @type {any} */configureError
try {
  const { config } = useAppInfo()
  if (window.parent && reactiveSearchParams.draft === 'true' && config.staticFilters?.length && !config.qsFilter) window.parent.postMessage({ type: 'set-config', content: { field: 'qsFilter', value: filters2qs(config.staticFilters) } }, '*')
} catch (e) {
  // @ts-ignore
  configureError = e.message
  // @ts-ignore
  ofetch(window.APPLICATION.href + '/error', { body: { message: e.message || e }, method: 'POST' })
}

</script>

<template>
  <template v-if="!configureError">
    <Chart style="height:100%" />
    <snack-bar />
  </template>
</template>
