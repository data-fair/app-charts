<template lang="html">
  <v-autocomplete
    v-model:search="search"
    v-model="dynamicFilter.values"
    :items="dynamicFilter.values.concat(items.filter(value => !dynamicFilter.values.includes(value)))"
    :label="`Filtrer par ${dynamicFilter.field.label}`"
    :loading="loading"
    clearable
    persistent-clear
    multiple
    class="chart-filter"
    hide-no-data
    hide-details
    placeholder="Saisissez une valeur"
    @update:model-value="applyFilter"
    @click:clear="clearFilter"
  />
</template>

<script>
import getReactiveSearchParams from '@data-fair/lib/vue/reactive-search-params-global.js'
import useAppInfo from '@/composables/useAppInfo'
import { computedAsync, refDebounced } from '@vueuse/core'
import { filters2qs } from '../assets/filters-utils'
import { ofetch } from 'ofetch'
import { ref, computed, watchEffect } from 'vue'
import { useConceptFilters } from '@data-fair/lib/vue/concept-filters.js'

export default {
  props: ['indice'],
  setup (props) {
    let loading = false
    const appInfo = useAppInfo()
    const rawSearch = ref('')
    const search = refDebounced(rawSearch, 300)
    const urlSearchParams = getReactiveSearchParams

    const config = computed(() => appInfo.config)
    const conceptFilters = useConceptFilters(getReactiveSearchParams)
    const dynamicFilter = computed(() => config.value.dynamicFilters[props.indice])
    const higherFilters = computed(() => config.value.dynamicFilters.slice(0, props.indice))

    const items = computedAsync(async () => {
      if (loading) return []
      loading = true
      const qs = filters2qs(config.value.staticFilters.concat(higherFilters.value))
      try {
        const response = await ofetch(config.value.datasets[0].href + '/values/' + encodeURIComponent(dynamicFilter.value.field.key), {
          params: {
            size: 10,
            qs,
            ...conceptFilters,
            q: search.value ? search.value + '*' : ''
          }
        })
        const unique = [...new Set(response)].filter(value => !dynamicFilter.value.values.includes(value))
        appInfo.fetchData()
        loading = false
        return unique
      } catch (error) {
        console.error(error)
        appInfo.fetchData()
        loading = false
        return []
      }
    },
    [],
    { lazy: true, loading })

    watchEffect(() => {
      const urlparams = urlSearchParams[dynamicFilter.value.field.key + '_in'] || dynamicFilter.value.defaultValues || []
      const vals = typeof urlparams === 'string' ? urlparams.split(',').map(value => value.replace(/"/g, '')) : urlparams
      dynamicFilter.value.values = vals
    })

    const applyFilter = (values) => {
      if (values && values.length) {
        urlSearchParams[dynamicFilter.value.field.key + '_in'] = JSON.stringify(values).slice(1, -1)
      } else {
        delete urlSearchParams[dynamicFilter.value.field.key + '_in']
      }
      dynamicFilter.value.values = values
      appInfo.fetchData()
    }

    const clearFilter = async () => {
      applyFilter(null)
      dynamicFilter.value.values = dynamicFilter.value.defaultValues || []
      search.value = ''
    }

    return {
      search: rawSearch,
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
