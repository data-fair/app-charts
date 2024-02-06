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
import { ref, computed, inject, onMounted } from 'vue'
import configSchema from '../../public/config-schema.json'
import getReactiveSearchParams from '@data-fair/lib/vue/reactive-search-params.js'

export default {
  setup() {
    const store = inject('appInfo')
    const config = computed(() => store.config)
    const loading = ref(false)
    const selectedSort = ref(configSchema.definitions.sortCount.oneOf.find((option) => option.const === config.value.dataType.sort).title || configSchema.definitions.sortCount.oneOf[0].title)
    const sortOptions = ref([])
    const urlSearchParams = getReactiveSearchParams()

    const applySort = (sortValue) => {
      const selectedOption = sortOptions.value.find((option) => option.title === sortValue)
      if (selectedOption) {
        config.value.dataType.sort = selectedOption.key
        urlSearchParams.count_sort_by_1 = selectedOption.key
      }
      store.fetchData()
    }

    function cleanSearchParams() {
      urlSearchParams.sort_by = undefined
      urlSearchParams.sort_order = undefined
      urlSearchParams.metric_sort_by_1 = undefined
      urlSearchParams.metric_sort_by_2 = undefined
      urlSearchParams.calculate_by = undefined
      if (!config.value.dataType.dynamicSort2) {
        urlSearchParams.count_sort_by_2 = undefined
      }
    }

    onMounted(async () => {
      if (loading.value) return
      loading.value = true
      sortOptions.value.push(...configSchema.definitions.sortCount.oneOf.map((option) => {
        return {
          key: option.const,
          title: option.title
        }
      }))
      cleanSearchParams()
      selectedSort.value = sortOptions.value.find((option) => option.key === urlSearchParams.count_sort_by_1) || configSchema.definitions.sortCount.oneOf.find((option) => option.const === configSchema.definitions.sortCount.default).title
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
