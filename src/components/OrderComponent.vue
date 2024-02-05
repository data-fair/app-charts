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

export default {
  setup() {
    const store = inject('appInfo')
    const config = computed(() => store.config)
    const loading = ref(false)
    const selectedOrder = ref(configSchema.definitions.sortOrder.oneOf.find((option) => option.const === config.value.dataType.sortOrder).title || configSchema.definitions.sortOrder.oneOf[0].title)
    const orderOptions = ref([])

    const applyOrder = (orderValue) => {
      config.value.dataType.sortOrder = orderOptions.value.find((option) => option.title === orderValue).key
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
      loading.value = false
    })

    return {
      selectedOrder,
      applyOrder,
      orderOptions
    }
  }
}
</script>

<style lang="css">
</style>
