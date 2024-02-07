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
import axios from 'redaxios'
import { ref, computed, inject, onMounted } from 'vue'
import configSchema from '../../public/config-schema.json'
import getReactiveSearchParams from '@data-fair/lib/vue/reactive-search-params.js'

export default {
  setup() {
    const store = inject('appInfo')
    const config = computed(() => store.config)
    const loading = ref(false)
    const selectedSort = ref((config.value.dataType.sortBy?.title ?? config.value.dataType.valuesFields[0].title) || configSchema.definitions.sortBy.default.key)
    const sortOptions = ref([])
    const urlSearchParams = getReactiveSearchParams()

    const applySort = (sortValue) => {
      const selectedOption = sortOptions.value.find((option) => option.title === sortValue)
      if (selectedOption) {
        config.value.dataType.sortBy.key = selectedOption.key
        urlSearchParams.sort_by = selectedOption.key
      }
      store.fetchData()
    }

    function cleanSearchParams() {
      urlSearchParams.count_sort_by_1 = undefined
      urlSearchParams.count_sort_by_2 = undefined
      urlSearchParams.metric_sort_by_1 = undefined
      urlSearchParams.metric_sort_by_2 = undefined
      urlSearchParams.calculate_by = undefined
    }

    onMounted(async () => {
      if (loading.value) return
      loading.value = true
      sortOptions.value.push({
        key: configSchema.definitions.sortBy.default.key,
        title: configSchema.definitions.sortBy.default.key
      })
      const schema = await axios.get(config.value.datasets[0].href + '/schema?calculated=false')
      sortOptions.value.push(...schema.data.map((field) => {
        return {
          key: field.key,
          title: field.title
        }
      }))
      sortOptions.value = sortOptions.value.filter((option) => option.title !== '_i')
      cleanSearchParams()
      selectedSort.value = sortOptions.value.find((option) => option.key === urlSearchParams.sort_by) || (config.value.dataType.sortBy?.title ?? config.value.dataType.valuesFields[0].title) || configSchema.definitions.sortBy.default.key
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