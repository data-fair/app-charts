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
import { ref, computed, inject, onMounted } from 'vue'
import configSchema from '../../public/config-schema.json'

export default {
  setup() {
    const store = inject('appInfo')
    const config = computed(() => store.config)
    const loading = ref(false)
    const selectedSort = ref(configSchema.definitions.sortCount.oneOf.find((option) => option.const === config.value.dataType.secondSort).title || configSchema.definitions.sortCount.oneOf[0].title)
    const sortOptions = ref([])

    const applySort = (orderValue) => {
      config.value.dataType.secondSort = sortOptions.value.find((option) => option.title === orderValue).key
      store.fetchData()
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
      loading.value = false
    })

    return {
      selectedSort,
      applySort,
      sortOptions
    }
  }
}
</script>

<style lang="css">
</style>
