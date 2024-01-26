<template>
  <ChartComponent v-if="application" />
</template>

<script>
import ChartComponent from './components/ChartComponent.vue'
import { computed, watch, onMounted, inject } from 'vue'
import { useRoute } from 'vue-router'

export default {
  components: { ChartComponent },
  setup() {
    const store = inject('appInfo')
    const route = useRoute()

    const application = computed(() => store.application)

    const fetchData = () => {
      const conceptFilters = {}
      for (const key in route.query) {
        if (key.startsWith('_c_')) {
          conceptFilters[key] = route.query[key]
        }
      }
      store.conceptFilters = conceptFilters
      store.fetchData()
    }

    watch(
      () => route.query,
      () => {
        fetchData()
      },
      { immediate: true }
    )

    onMounted(() => {
      if (!application.value) {
        window.location.href = 'https://github.com/data-fair/app-charts'
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
