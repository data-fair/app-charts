<template>
  <ChartComponent v-if="application" />
</template>

<script>
import ChartComponent from './components/ChartComponent.vue'
import { computed, watch, onMounted, inject, ref } from 'vue'

export default {
  components: { ChartComponent },
  setup() {
    const store = inject('appInfo')
    const application = computed(() => store.application)
    const urlSearchParams = ref(new URLSearchParams(window.location.search))

    const fetchData = () => {
      const conceptFilters = {}
      for (const key of urlSearchParams.value.keys()) {
        if (key.startsWith('_c_')) {
          conceptFilters[key] = urlSearchParams.value.get(key)
        }
      }
      store.conceptFilters = conceptFilters
      store.fetchData()
    }

    const updateSearchParams = () => {
      urlSearchParams.value = ref(new URLSearchParams(window.location.search))
    }

    watch(urlSearchParams, (newParams) => {
      fetchData()
    }, { immediate: true })

    window.addEventListener('popstate', updateSearchParams)

    onMounted(() => {
      if (!application.value) {
        window.location.href = 'https://github.com/data-fair/app-charts'
      } else {
        fetchData()
      }
    })

    return {
      application
    }
  }
}
</script>

<style>
</style>
