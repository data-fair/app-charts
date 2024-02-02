<template lang="html">
  <v-container>
    <v-row>
      <v-col v-for="(dynamicFilter, i) in config.dynamicFilters" :key="i" cols="12" sm="6" md="4">
        <ChartFilter :indice="i" />
      </v-col>
      <v-col v-if="config.dataType.dynamicSort" cols="12" sm="6" md="4">
        <SortComponent />
      </v-col>
      <v-col v-if="config.dataType.dynamicMetric" cols="12" sm="6" md="4">
        <MetricComponent />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import ChartFilter from './ChartFilter.vue'
import SortComponent from './SortComponent.vue'
import MetricComponent from './MetricComponent.vue'
import { defineComponent, computed, inject } from 'vue'

export default defineComponent({
  components: { ChartFilter, SortComponent, MetricComponent },
  setup() {
    const store = inject('appInfo')

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
