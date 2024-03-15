<template lang="html">
  <v-select
    :items="sortOptions"
    label="Trier par"
    :loading="loading"
    v-model="selectedSort"
    @update:model-value="applySort"
  ></v-select>
</template>

<script>
import getReactiveSearchParams from '@data-fair/lib/vue/reactive-search-params-global.js'
import useAppInfo from '@/composables/useAppInfo'
import { ofetch } from 'ofetch'
import { ref, computed, onMounted } from 'vue'
import configSchema from '../../public/config-schema.json'

export default {
  setup() {
    const appInfo = useAppInfo()
    const config = computed(() => appInfo.config)
    const loading = ref(false)
    const selectedSort = ref((config.value.dataType.sortBy?.title ?? config.value.dataType.valuesFields[0].title) || configSchema.definitions.sortBy.default.key)
    const sortOptions = ref([])
    const urlSearchParams = getReactiveSearchParams

    const applySort = (sortValue) => {
      const selectedOption = sortOptions.value.find((option) => option.title === sortValue)
      if (selectedOption) {
        config.value.dataType.sortBy.key = selectedOption.key
        urlSearchParams.sort_by = selectedOption.key
      }
      appInfo.fetchData()
    }

    function cleanSearchParams() {
      if (urlSearchParams.count_sort_by_1) urlSearchParams.count_sort_by_1 = undefined
      if (urlSearchParams.count_sort_by_2) urlSearchParams.count_sort_by_2 = undefined
      if (urlSearchParams.metric_sort_by_1) urlSearchParams.metric_sort_by_1 = undefined
      if (urlSearchParams.metric_sort_by_2) urlSearchParams.metric_sort_by_2 = undefined
      if (urlSearchParams.calculate_by) urlSearchParams.calculate_by = undefined
    }

    onMounted(async () => {
      if (loading.value) return
      loading.value = true
      sortOptions.value = [{
        key: configSchema.definitions.sortBy.default.key,
        title: configSchema.definitions.sortBy.default.key
      }]
      const schema = await ofetch(config.value.datasets[0].href + '/schema?calculated=false')
      sortOptions.value.push(...schema.map((field) => ({
        key: field.key,
        title: field.title
      })).filter((option) => option.title !== '_i'))
      cleanSearchParams()
      const urlSortKey = urlSearchParams.sort_by
      const defaultSort = config.value.dataType.sortBy?.title ?? config.value.dataType.valuesFields[0].title ?? configSchema.definitions.sortBy.default.key
      selectedSort.value = sortOptions.value.find((option) => option.key === urlSortKey)?.title ?? defaultSort
      applySort(selectedSort.value)
      loading.value = false
    })

    return {
      selectedSort,
      sortOptions,
      applySort,
      loading
    }
  }
}
</script>

<style lang="css">
</style>
