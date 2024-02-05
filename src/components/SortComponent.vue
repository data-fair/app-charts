<template lang="html">
  <v-select
    :items="sortOptions"
    :label="`${prepType}Trier par`"
    :loading="loading"
    v-model="selectedSort"
    @update:model-value="applySort"
  ></v-select>
</template>

<script>
import axios from 'redaxios'
import { ref, computed, inject, onMounted } from 'vue'
import configSchema from '../../public/config-schema.json'

export default {
  setup() {
    const store = inject('appInfo')
    const config = computed(() => store.config)
    const loading = ref(false)
    const selectedSort = ref(configSchema.definitions.sortBy.default.key)
    const sortOptions = ref([])
    const dataType = computed(() => config.value.dataType.type)
    const prepType = computed(() => {
      let type = ''
      if (dataType.value === 'linesBased') {
        // there is only one sort option for linesBased, so no need to precise which type it is
      } else if (dataType.value === 'countBased') {
        type = configSchema.definitions.countBasedChart.title + ' : '
      } else if (dataType.value === 'metricBased') {
        type = configSchema.definitions.metricBasedChart.title + ' : '
      }
      return type
    })

    /* if (dataType.value === 'linesBased') {
      console.log(configSchema.definitions.sortBy)
      return configSchema.definitions.sortBy.default.key
    } */
    const applySort = (sortValue) => {
      config.value.dataType.sortBy.key = sortOptions.value.find((option) => option.title === sortValue).key
      store.fetchData()
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
      loading.value = false
    })

    return {
      selectedSort,
      sortOptions,
      applySort,
      loading,
      prepType
    }
  }
}
</script>

<style lang="css">
</style>
