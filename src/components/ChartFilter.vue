<template lang="html">
  <v-autocomplete
    :items="dynamicFilter.values.concat(items)"
    :value="dynamicFilter.values"
    :label="`Filtrer par ${dynamicFilter.field.label}`"
    :loading="loading"
    v-model:search="search"
    :clearable="true"
    :multiple="true"
    :filter="() => true"
    class="chart-filter"
    hide-no-data
    placeholder="Saisissez une valeur"
    @change="applyFilter"
  />
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'
import useMainStore from '@/stores/useMainStore'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { filters2qs } from '../assets/filters-utils'

export default {
  props: ['indice'],
  setup(props) {
    const store = useMainStore()
    const router = useRouter()
    const loading = ref(false)
    const search = ref('')
    const items = ref(null)

    const config = computed(() => store.config)
    const conceptFilters = computed(() => store.conceptFilters)

    const dynamicFilter = computed(() => config.value.dynamicFilters[props.indice])
    const higherFilters = computed(() => config.value.dynamicFilters.slice(0, props.indice))

    watch(search, async (val, oldVal) => {
      if (val === oldVal && items.value !== null) return
      await fetchItems()
    })

    watch(higherFilters, async () => {
      dynamicFilter.value.values = dynamicFilter.value.defaultValues || []
      search.value = ''
      await fetchItems()
    }, { deep: true })

    onMounted(() => {
      dynamicFilter.value.values = dynamicFilter.value.defaultValues || []
    })

    const fetchItems = async () => {
      if (loading.value) return
      loading.value = true
      const qs = filters2qs(config.value.staticFilters.concat(higherFilters.value))
      try {
        const response = await axios.get(config.value.datasets[0].href + '/values/' + encodeURIComponent(dynamicFilter.value.field.key), {
          params: {
            size: 10,
            qs,
            ...conceptFilters.value,
            q: search.value ? search.value + '*' : ''
          }
        })
        items.value = response.data
      } catch (error) {
        console.error(error)
      } finally {
        loading.value = false
      }
    }

    const applyFilter = (values) => {
      const newQuery = { ...router.currentRoute.value.query }
      if (values && values.length) {
        newQuery[dynamicFilter.value.field.key + '_in'] = JSON.stringify(values).slice(1, -1)
      } else {
        delete newQuery[dynamicFilter.value.field.key + '_in']
      }
      router.replace({ query: newQuery })
    }

    return {
      search,
      loading,
      items,
      dynamicFilter,
      applyFilter
    }
  }
}
</script>

<style lang="css">
.chart-filter .v-text-field__details {
  display: none
}
</style>
