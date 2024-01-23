<template lang="html">
  <v-layout row wrap>
    <v-flex v-for="(dynamicFilter, i) in config.dynamicFilters" :key="i" xs12 sm6 md4>
      <chart-filter :indice="i" />
    </v-flex>
  </v-layout>
</template>

<script>
import ChartFilter from './ChartFilter.vue'
import { defineComponent, computed } from 'vue'
import useMainStore from '@/stores/useMainStore'

export default defineComponent({
  components: { ChartFilter },
  setup() {
    const store = useMainStore()

    const config = computed(() => store.config)
    const application = computed(() => store.application)

    return {
      config,
      application
    }
  }
})
</script>

<style lang="css">
</style>
