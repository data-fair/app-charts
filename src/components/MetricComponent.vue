<template lang="html">
  <v-select
    v-model="selectedMetric"
    :items="metricOptions"
    :label="`Calcul${metricType}`"
    :loading="loading"
    @update:model-value="applyMetric"
  />
</template>

<script>
import getReactiveSearchParams from '@data-fair/lib/vue/reactive-search-params-global.js'
import useAppInfo from '@/composables/useAppInfo'
import { ofetch } from 'ofetch'
import { ref, computed, onMounted } from 'vue'
import configSchema from '../../public/config-schema.json'

export default {
  setup () {
    const appInfo = useAppInfo()
    const config = computed(() => appInfo.config)
    const loading = ref(false)
    const selectedMetric = ref(config.value.dataType.valueField?.title ?? '')
    const metricOptions = ref([])
    const metricType = computed(() => ' : ' + configSchema.definitions.metricType.oneOf.find((option) => option.const === config.value.dataType.metricType).title || '')
    const urlSearchParams = getReactiveSearchParams

    const applyMetric = (metricValue) => {
      const selectedOption = metricOptions.value.find((option) => option.title === metricValue)
      if (selectedOption) {
        config.value.dataType.valueField.key = selectedOption.key
        urlSearchParams.calculate_by = selectedOption.key
      }
      appInfo.fetchData()
    }

    function cleanSearchParams () {
      if (urlSearchParams.sort_by) urlSearchParams.sort_by = undefined
      if (urlSearchParams.sort_order) urlSearchParams.sort_order = undefined
      if (urlSearchParams.count_sort_by_1) urlSearchParams.count_sort_by_1 = undefined
      if (urlSearchParams.count_sort_by_2) urlSearchParams.count_sort_by_2 = undefined
      if (!config.value.dataType.dynamicSort1 && urlSearchParams.sort_by_1) {
        urlSearchParams.sort_by_1 = undefined
      }
      if (!config.value.dataType.dynamicSort2 && urlSearchParams.sort_by_2) {
        urlSearchParams.sort_by_2 = undefined
      }
    }

    onMounted(async () => {
      if (loading.value) return
      loading.value = true
      const schema = await ofetch(config.value.datasets[0].href + '/schema?calculated=false&type=integer,number')
      metricOptions.value = schema.map(field => ({
        key: field.key,
        title: field.title
      }))
      cleanSearchParams()
      const urlMetricKey = urlSearchParams.calculate_by
      selectedMetric.value = metricOptions.value.find(option => option.key === urlMetricKey)?.title || metricOptions.value[0]?.title
      applyMetric(selectedMetric.value)
      loading.value = false
    })

    return {
      selectedMetric,
      metricOptions,
      applyMetric,
      loading,
      metricType
    }
  }
}
</script>

<style lang="css">
</style>
