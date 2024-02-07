<template lang="html">
  <v-autocomplete
    :items="dynamicFilter.values.concat(items)"
    :label="`Filtrer par ${dynamicFilter.field.label}`"
    :loading="loading"
    v-model:search="search"
    v-model="dynamicFilter.values"
    :clearable="true"
    :multiple="true"
    class="chart-filter"
    hide-no-data
    hide-details
    placeholder="Saisissez une valeur"
    @update:model-value="applyFilter"
    @click:clear="clearFilter"
  />
</template>

<script>
import axios from 'redaxios'
import { filters2qs } from '../assets/filters-utils'
import { ref, computed, watch, onMounted, inject } from 'vue'
import getReactiveSearchParams from '@data-fair/lib/vue/reactive-search-params.js'

export default {
  props: ['indice'],
  setup(props) {
    const store = inject('appInfo')
    const loading = ref(false)
    const search = ref('')
    const items = ref([])
    const urlSearchParams = getReactiveSearchParams()

    const config = computed(() => store.config)
    const conceptFilters = computed(() => store.conceptFilters)
    const dynamicFilter = computed(() => config.value.dynamicFilters[props.indice])
    const higherFilters = computed(() => config.value.dynamicFilters.slice(0, props.indice))

    watch(search, async (val, oldVal) => {
      if (val === oldVal && items.value.length === 0) {
        return
      }
      await fetchItems()
    })

    watch(higherFilters, async () => {
      await clearFilter()
    }, { deep: true })

    onMounted(async () => {
      const urlparams = urlSearchParams[dynamicFilter.value.field.key + '_in'] || dynamicFilter.value.defaultValues || []
      const vals = typeof urlparams === 'string' ? urlparams.split(',').map(value => value.replace(/"/g, '')) : urlparams
      dynamicFilter.value.values = vals
      await fetchItems()
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
        const unique = [...new Set(response.data)]
        unique.forEach((value, index) => {
          if (dynamicFilter.value.values.includes(value)) {
            unique.splice(index, 1)
          }
        })
        items.value = unique
      } catch (error) {
        console.error(error)
      } finally {
        loading.value = false
        store.fetchData()
      }
    }

    const applyFilter = (values) => {
      if (values && values.length) {
        urlSearchParams[dynamicFilter.value.field.key + '_in'] = JSON.stringify(values).slice(1, -1)
        items.value = items.value.filter(item => !values.includes(item))
      } else {
        delete urlSearchParams[dynamicFilter.value.field.key + '_in']
      }
      dynamicFilter.value.values = values
      store.fetchData()
    }

    const clearFilter = async () => {
      applyFilter(null)
      dynamicFilter.value.values = dynamicFilter.value.defaultValues || []
      search.value = ''
      await fetchItems()
    }

    return {
      search,
      loading,
      items,
      dynamicFilter,
      applyFilter,
      clearFilter
    }
  }
}
</script>

<style lang="css">
.chart-filter .v-text-field__details {
  display: none;
}
</style>
