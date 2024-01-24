<template lang="html">
  <v-container>
    <v-row>
      <v-col v-for="(dynamicFilter, i) in config.dynamicFilters" :key="i" cols="12" sm="6" md="4">
        <chart-filter :indice="i" />
      </v-col>
    </v-row>
  </v-container>
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
