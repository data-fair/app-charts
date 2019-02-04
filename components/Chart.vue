<template lang="html">
  <v-container fluid class="pa-1">
    <template v-if="!incompleteConfig">
      <filters v-if="config.filters && config.dynamicFilters && config.dynamicFilters.length"/>
      <canvas id="myChart" :height="height" :width="width"/>
    </template>
  </v-container>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import Filters from './Filters'
import Chart from 'chart.js'
import chartUtils from '../assets/chart-utils.js'

export default {
  components: { Filters },
  data() {
    return { ready: false, chartTop: 0, chart: null, height: null, width: null }
  },
  computed: {
    ...mapState(['data']),
    ...mapGetters(['incompleteConfig', 'config'])
  },
  watch: {
    data: {
      handler() {
        this.renderChart()
      },
      immediate: true
    }
  },
  created() {
    if (this.incompleteConfig) {
      this.$store.dispatch('setError', new Error(this.incompleteConfig))
    }
  },
  async mounted() {
    this.ready = true
    await this.$nextTick()
    const chartEl = this.$el.querySelector('#myChart')
    if (chartEl) this.chartTop = chartEl.getBoundingClientRect().top
    window.addEventListener('resize', () => this.refresh(), true)
    this.refresh()
    await this.$nextTick()
    this.renderChart()
  },
  methods: {
    refresh() {
      this.height = window.innerHeight - this.chartTop
      this.width = window.innerWidth
    },
    renderChart() {
      if (!this.ready || !this.data || this.incompleteConfig) return
      try {
        if (!this.chart) {
          this.chart = new Chart(document.getElementById('myChart'), chartUtils.prepareChart(this.config, this.data))
        } else {
          this.chart.data = chartUtils.prepareChart(this.config, this.data).data
          this.chart.update()
        }
      } catch (err) {
        return this.$store.dispatch('setError', err)
      }
    }
  }
}
</script>

<style lang="css">
</style>
