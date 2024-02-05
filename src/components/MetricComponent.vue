<template lang="html">
  <v-select
    :items="metricOptions"
    label="Calcul"
    :loading="loading"
    v-model="selectedMetric"
    @update:model-value="applyMetric"
  ></v-select>
</template>

<script>
import axios from 'redaxios'
import { ref, computed, inject, onMounted } from 'vue'

export default {
  setup() {
    const store = inject('appInfo')
    const config = computed(() => store.config)
    const loading = ref(false)
    const selectedMetric = ref(config.value.dataType.valueField?.title ?? '')
    const metricOptions = ref([])

    const applyMetric = (sortValue) => {
      config.value.dataType.valueField.key = metricOptions.value.find((option) => option.title === sortValue).key
      store.fetchData()
    }

    onMounted(async () => {
      if (loading.value) return
      loading.value = true
      const schema = await axios.get(config.value.datasets[0].href + '/schema?calculated=false&type=integer,number')
      metricOptions.value.push(...schema.data.map((field) => {
        return {
          key: field.key,
          title: field.title
        }
      }))
      loading.value = false
    })

    return {
      selectedMetric,
      metricOptions,
      applyMetric,
      loading
    }
  }
}
</script>

<style lang="css">
</style>
