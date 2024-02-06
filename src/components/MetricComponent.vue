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
import getReactiveSearchParams from '@data-fair/lib/vue/reactive-search-params.js'

export default {
  setup() {
    const store = inject('appInfo')
    const config = computed(() => store.config)
    const loading = ref(false)
    const selectedMetric = ref(config.value.dataType.valueField?.title ?? '')
    const metricOptions = ref([])
    const urlSearchParams = getReactiveSearchParams()

    const applyMetric = (metricValue) => {
      const selectedOption = metricOptions.value.find((option) => option.title === metricValue)
      if (selectedOption) {
        config.value.dataType.valueField.key = selectedOption.key
        urlSearchParams.calculate_by = selectedOption.key
      }
      store.fetchData()
    }

    function cleanSearchParams() {
      urlSearchParams.sort_by = undefined
      urlSearchParams.sort_order = undefined
      urlSearchParams.count_sort_by_1 = undefined
      urlSearchParams.count_sort_by_2 = undefined
      if (!config.value.dataType.dynamicSort1) {
        urlSearchParams.sort_by_1 = undefined
      }
      if (!config.value.dataType.dynamicSort2) {
        urlSearchParams.sort_by_2 = undefined
      }
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
      cleanSearchParams()
      selectedMetric.value = metricOptions.value.find((option) => option.key === urlSearchParams.calculate_by) || metricOptions.value[0].title
      applyMetric(selectedMetric.value)
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
