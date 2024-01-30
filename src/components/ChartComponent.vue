<template lang="html">
  <v-container fluid class="pa-1">
    <template v-if="!incompleteConfig">
      <FiltersComponent v-if="config.dynamicFilters && config.dynamicFilters.length" />
      <canvas ref="chartCanvas" :height="height" :width="width" />
    </template>
  </v-container>
</template>

<script>
import chartUtils from '../assets/chart-utils.js'
import FiltersComponent from './FiltersComponent.vue'
import { Chart, BarController, BarElement, CategoryScale, LinearScale, LineController, LineElement, PointElement, PieController, ArcElement, RadarController, RadialLinearScale, Filler, Title, Tooltip } from 'chart.js'
import { ref, computed, onMounted, watch, nextTick, shallowRef, inject } from 'vue'

Chart.register(BarController, BarElement, CategoryScale, LinearScale, LineController, LineElement, PointElement, PieController, ArcElement, RadarController, RadialLinearScale, Filler, Title, Tooltip)

export default {
  components: { FiltersComponent },
  setup() {
    const store = inject('appInfo')
    const vuetify = inject('vuetify')
    const vuetifyColors = computed(() => vuetify.theme.current.value.colors)
    const chartCanvas = shallowRef(null)
    const chart = shallowRef(null)
    const chartTop = ref(0)
    const height = ref(null)
    const width = ref(null)

    const data = computed(() => store.data)
    const incompleteConfig = computed(() => store.incompleteConfig)
    const config = computed(() => store.config)
    config.value.vuetifyColors = vuetifyColors.value

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
