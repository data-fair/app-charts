<template lang="html">
  <v-select
    :items="sortOptions"
    label="1er groupe : Trier par"
    :loading="loading"
    v-model="selectedSort"
    @update:model-value="applySort"
  ></v-select>
</template>

<script>
import getReactiveSearchParams from '@data-fair/lib/vue/reactive-search-params-global.js'
import useAppInfo from '@/composables/useAppInfo'
import { ref, computed, onMounted } from 'vue'
import configSchema from '../../public/config-schema.json'

export default {
  setup() {
    const appInfo = useAppInfo()
    const config = computed(() => appInfo.config)
    const loading = ref(false)
    const selectedSort = ref(configSchema.definitions.sortMetric.oneOf.find((option) => option.const === config.value.dataType.sort).title || configSchema.definitions.sortMetric.oneOf[0].title)
    const sortOptions = ref([])
    const urlSearchParams = getReactiveSearchParams

    const applySort = (sortValue) => {
      const selectedOption = sortOptions.value.find((option) => option.title === sortValue)
      if (selectedOption) {
        config.value.dataType.sort = selectedOption.key
        urlSearchParams.metric_sort_by_1 = selectedOption.key
      }
      appInfo.fetchData()
    }

    function cleanSearchParams() {
      if (urlSearchParams.sort_by) urlSearchParams.sort_by = undefined
      if (urlSearchParams.sort_order) urlSearchParams.sort_order = undefined
      if (urlSearchParams.count_sort_by_1) urlSearchParams.count_sort_by_1 = undefined
      if (urlSearchParams.count_sort_by_2) urlSearchParams.count_sort_by_2 = undefined
      if (!config.value.dataType.dynamicSort2 && urlSearchParams.metric_sort_by_2) {
        urlSearchParams.metric_sort_by_2 = undefined
      }
      if (!config.value.dataType.dynamicMetric && urlSearchParams.calculate_by) {
        urlSearchParams.calculate_by = undefined
      }
    }

    onMounted(async () => {
      if (loading.value) return
      loading.value = true
      sortOptions.value = configSchema.definitions.sortMetric.oneOf.map(option => ({
        key: option.const,
        title: option.title
      }))
      cleanSearchParams()
      const urlSortKey = urlSearchParams.metric_sort_by_1
      const defaultSortOption = configSchema.definitions.sortMetric.oneOf.find(option => option.const === config.value.dataType.sort) || configSchema.definitions.sortMetric.oneOf[0]
      selectedSort.value = sortOptions.value.find(option => option.key === urlSortKey)?.title || defaultSortOption.title
      applySort(selectedSort.value)
      loading.value = false
    })

    return {
      selectedSort,
      applySort,
      sortOptions,
      loading
    }
  }
}
</script>

<style lang="css">
</style>
