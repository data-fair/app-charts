<script setup>
import Chart from './components/Chart.vue'
import reactiveSearchParams from '@data-fair/lib/vue/reactive-search-params-global.js'
import useAppInfo from './composables/useAppInfo'
import { ofetch } from 'ofetch'

// @ts-ignore
window.vIframeOptions = { reactiveParams: reactiveSearchParams }

let /** @type {any} */configureError
try {
  useAppInfo()
} catch (e) {
  // @ts-ignore
  configureError = e.message
  // @ts-ignore
  ofetch(window.APPLICATION.href + '/error', { body: { message: e.message || e }, method: 'POST' })
}

</script>

<template>
  <Chart v-if="!configureError" />
</template>
