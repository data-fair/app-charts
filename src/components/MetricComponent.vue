<template lang="html">
  <v-select
    :items="metricOptions"
    label="Metric"
    v-model="selectedMetric"
    @change="applyMetric"
  ></v-select>
</template>

<script>
import { ref, computed, inject } from 'vue'

export default {
  setup() {
    const store = inject('appInfo')
    const config = computed(() => store.config)
    const selectedMetric = ref(config.value.dataType.metricType.default)

    const metricOptions = computed(() => {
      // Generate metric options based on schema
      return config.value.dataType.metricType.oneOf.map(option => ({
        text: option.title,
        value: option.const
      }))
    })

    const applyMetric = (metricValue) => {
      // Directly update the reactive config state
      config.value.dataType.metricType = metricValue
      // Trigger any other necessary updates or re-fetching of data
      store.fetchData()
    }

    return {
      selectedMetric,
      metricOptions,
      applyMetric
    }
  }
}
</script>

<style lang="css">
</style>
