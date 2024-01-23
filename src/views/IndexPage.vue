<template>
  <ChartComponent v-if="application" />
  <p v-else>L'application n'est pas disponible</p>
</template>

<script>
import { computed, watch, onMounted } from 'vue'
import useMainStore from '@/stores/useMainStore'
import { useRoute, useRouter } from 'vue-router'
import ChartComponent from '../components/ChartComponent.vue'

export default {
  components: { ChartComponent },
  setup() {
    const store = useMainStore()
    const route = useRoute()
    const router = useRouter()

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
        router.push('/about')
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
