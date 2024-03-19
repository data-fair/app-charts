<template>
  <ChartComponent v-if="application" />
</template>

<script>
import ChartComponent from './components/ChartComponent.vue'
import getReactiveSearchParams from '@data-fair/lib/vue/reactive-search-params-global.js'
import useAppInfo from './composables/useAppInfo'
import { computed, inject, onMounted } from 'vue'
import { ofetch } from 'ofetch'

export default {
  components: { ChartComponent },
  setup () {
    let /** @type {any} */ appInfo = null
    let /** @type {any} */ application = null
    try {
      appInfo = useAppInfo()
      const env = inject('startEnv')
      appInfo.init(env)
      application = computed(() => appInfo.application)
    } catch (/** @type{any} */ e) {
      // @ts-ignore
      ofetch(window.APPLICATION.href + '/error', { body: { message: e.message || e }, method: 'POST' })
    }
    const urlSearchParams = getReactiveSearchParams
    // @ts-ignore
    window.vIframeOptions = { reactiveParams: urlSearchParams }

    onMounted(() => {
      if (application === null) {
        window.location.href = 'https://github.com/data-fair/app-charts'
      } else {
        appInfo.fetchData()
      }
    })

    return {
      application
    }
  }
}
</script>

<style>
</style>
