<template lang="html">
  <v-container>
    <v-row>
      <v-col v-for="(dynamicFilter, i) in config.dynamicFilters" :key="i" cols="12" sm="6" md="4">
        <ChartFilter :indice="i" />
      </v-col>
      <v-col v-if="dataType === 'linesBased' && config.dataType.dynamicSort" cols="12" sm="6" md="4">
        <LinesSortComponent />
      </v-col>
      <v-col v-if="dataType === 'linesBased' && config.dataType.dynamicSort" cols="12" sm="6" md="4">
        <OrderComponent />
      </v-col>
      <v-col v-if="dataType === 'countBased' && config.dataType.dynamicSort1" cols="12" sm="6" md="4">
        <CountSort1Component />
      </v-col>
      <v-col v-if="dataType === 'countBased' && config.dataType.dynamicSort2" cols="12" sm="6" md="4">
        <CountSort2Component />
      </v-col>
      <v-col v-if="dataType === 'metricBased' && config.dataType.dynamicSort1" cols="12" sm="6" md="4">
        <MetricSort1Component />
      </v-col>
      <v-col v-if="dataType === 'metricBased' && config.dataType.dynamicSort2" cols="12" sm="6" md="4">
        <MetricSort2Component />
      </v-col>
      <v-col v-if="dataType === 'metricBased' && config.dataType.dynamicMetric" cols="12" sm="6" md="4">
        <MetricComponent />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import ChartFilter from './ChartFilter.vue'
import CountSort1Component from './CountSort1Component.vue'
import CountSort2Component from './CountSort2Component.vue'
import LinesSortComponent from './LinesSortComponent.vue'
import MetricComponent from './MetricComponent.vue'
import MetricSort1Component from './MetricSort1Component.vue'
import MetricSort2Component from './MetricSort2Component.vue'
import OrderComponent from './OrderComponent.vue'
import { defineComponent, computed, inject } from 'vue'

export default defineComponent({
  components: { ChartFilter, CountSort1Component, CountSort2Component, LinesSortComponent, MetricComponent, MetricSort1Component, MetricSort2Component, OrderComponent },
  setup() {
    const store = inject('appInfo')
    const dataType = computed(() => config.value.dataType.type)

    const config = computed(() => store.config)
    const application = computed(() => store.application)

    return {
      config,
      application,
      dataType
    }
  }
})
</script>

<style lang="css">
</style>
