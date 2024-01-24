<template lang="html">
  <v-container fluid class="pa-1">
    <template v-if="!incompleteConfig">
      <FiltersComponent v-if="config.dynamicFilters && config.dynamicFilters.length" />
      <canvas ref="chartCanvas" :height="height" :width="width" />
    </template>
  </v-container>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import useMainStore from '@/stores/useMainStore'
import FiltersComponent from './FiltersComponent.vue'
import { Chart, registerables } from 'chart.js'
import chartUtils from '../assets/chart-utils.js'

Chart.register(...registerables)

export default {
  components: { FiltersComponent },
  setup() {
    const store = useMainStore()
    const chartCanvas = ref(null)
    const chart = ref(null)
    const chartTop = ref(0)
    const height = ref(null)
    const width = ref(null)

    const data = computed(() => store.data)
    const incompleteConfig = computed(() => store.incompleteConfig)
    const config = computed(() => store.config)

    watch(data, async () => {
      await nextTick()
      renderChart()
    }, { immediate: true })

    onMounted(async () => {
      await nextTick()
      if (chartCanvas.value) {
        chartTop.value = chartCanvas.value.getBoundingClientRect().top
      }
      window.addEventListener('resize', refresh, true)
      refresh()
    })

    const refresh = async () => {
      height.value = window.innerHeight - chartTop.value
      width.value = window.innerWidth
      if (chart.value) {
        chart.value.destroy()
        chart.value = null
      }
      await nextTick()
      renderChart()
    }

    const renderChart = () => {
      if (!data.value || incompleteConfig.value) return
      try {
        if (!chart.value) {
          chart.value = new Chart(chartCanvas.value.getContext('2d'), chartUtils.prepareChart(config.value, data.value))
        } else {
          chart.value.data = chartUtils.prepareChart(config.value, data.value).data
          chart.value.update()
        }
      } catch (err) {
        store.setError(err)
      }
    }

    return {
      chartCanvas,
      height,
      width,
      incompleteConfig,
      config
    }
  }
}
</script>

<style lang="css">
</style>
