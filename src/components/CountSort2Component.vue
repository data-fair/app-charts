<template lang="html">
  <v-select
    v-model="selectedSort"
    :items="sortOptions"
    label="2ème groupe : Trier par"
    :loading="loading"
    @update:model-value="applySort"
  />
</template>

<script>
import getReactiveSearchParams from '@data-fair/lib/vue/reactive-search-params-global.js'
import useAppInfo from '@/composables/useAppInfo'
import { ref, computed, onMounted } from 'vue'
import configSchema from '../../public/config-schema.json'

export default {
  setup () {
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

    function cleanSearchParams () {
      if (urlSearchParams.sort_by) urlSearchParams.sort_by = undefined
      if (urlSearchParams.sort_order) urlSearchParams.sort_order = undefined
      if (urlSearchParams.metric_sort_by_1) urlSearchParams.metric_sort_by_1 = undefined
      if (urlSearchParams.metric_sort_by_2) urlSearchParams.metric_sort_by_2 = undefined
      if (urlSearchParams.calculate_by) urlSearchParams.calculate_by = undefined
      if (!config.value.dataType.dynamicSort1 && urlSearchParams.count_sort_by_1) {
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
