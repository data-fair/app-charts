<template>
  <ChartComponent v-if="application" />
</template>

<script>
import ChartComponent from './components/ChartComponent.vue'
import getReactiveSearchParams from '@data-fair/lib/vue/reactive-search-params-global.js'
import { computed, onMounted, inject } from 'vue'

export default {
  components: { ChartComponent },
  setup() {
    const store = inject('appInfo')
    const application = computed(() => store.application)
    const urlSearchParams = getReactiveSearchParams
    window.vIframeOptions = { reactiveParams: urlSearchParams }

    onMounted(() => {
      if (!application.value) {
        window.location.href = 'https://github.com/data-fair/app-charts'
      } else {
        store.fetchData()
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
