<template lang="html">
  <v-select
    :items="orderOptions"
    label="Ordre"
    :loading="loading"
    v-model="selectedOrder"
    @update:model-value="applyOrder"
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
    const selectedOrder = ref(configSchema.definitions.sortOrder.oneOf.find((option) => option.const === config.value.dataType.sortOrder).title || configSchema.definitions.sortOrder.oneOf[0].title)
    const orderOptions = ref([])
    const urlSearchParams = getReactiveSearchParams()

    const applyOrder = (orderValue) => {
      const selectedOption = orderOptions.value.find((option) => option.title === orderValue)
      if (selectedOption) {
        config.value.dataType.sortOrder = selectedOption.key
        urlSearchParams.sort_order = selectedOption.key
      }
      store.fetchData()
    }

    onMounted(async () => {
      if (loading.value) return
      loading.value = true
      orderOptions.value.push(...configSchema.definitions.sortOrder.oneOf.map((option) => {
        return {
          key: option.const,
          title: option.title
        }
      }))
      console.log(orderOptions.value.find((option) => option.key === urlSearchParams.sort_order))
      selectedOrder.value = orderOptions.value.find((option) => option.key === urlSearchParams.sort_order) || config.value.dataType.sortOrder || configSchema.definitions.sortOrder.oneOf.find((option) => option.const === configSchema.definitions.sortOrder.default).title
      applyOrder(selectedOrder.value)
      loading.value = false
    })

    return {
      selectedOrder,
      applyOrder,
      orderOptions,
      loading
    }
  }
}
</script>

<style lang="css">
</style>
