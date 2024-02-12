<template lang="html">
  <v-select
    :items="sortOptions"
    label="2ème groupe : Trier par"
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
    const selectedSort = ref(configSchema.definitions.sortCount.oneOf.find((option) => option.const === config.value.dataType.secondSort).title || configSchema.definitions.sortCount.oneOf[0].title)
    const sortOptions = ref([])
    const urlSearchParams = getReactiveSearchParams

    const applySort = (sortValue) => {
      const selectedOption = sortOptions.value.find((option) => option.title === sortValue)
      if (selectedOption) {
        config.value.dataType.secondSort = selectedOption.key
        urlSearchParams.count_sort_by_2 = selectedOption.key
      }
      appInfo.fetchData()
    }

    function cleanSearchParams() {
      urlSearchParams.sort_by = undefined
      urlSearchParams.sort_order = undefined
      urlSearchParams.metric_sort_by_1 = undefined
      urlSearchParams.metric_sort_by_2 = undefined
      urlSearchParams.calculate_by = undefined
      if (!config.value.dataType.dynamicSort1) {
        urlSearchParams.count_sort_by_1 = undefined
      }
    }

    onMounted(async () => {
      if (loading.value) return
      loading.value = true
      sortOptions.value = configSchema.definitions.sortCount.oneOf.map((option) => ({
        key: option.const,
        title: option.title
      }))
      cleanSearchParams()
      const urlSortKey = urlSearchParams.count_sort_by_2
      const defaultSort = configSchema.definitions.sortCount.oneOf.find((option) => option.const === config.value.dataType.secondSort)?.title || configSchema.definitions.sortCount.default
      selectedSort.value = sortOptions.value.find((option) => option.key === urlSortKey)?.title || defaultSort
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
