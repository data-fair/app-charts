<template lang="html">
  <v-container fluid class="pa-0">
    <template v-if="!incompleteConfig">
      <filters v-if="config.filters && config.filters.length"/>
      <data-table v-if="config.chart.type === 'table'" />
      <canvas v-else id="myChart" :height="dimension.height" :width="dimension.width"/>
    </template>
  </v-container>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import DataTable from './DataTable'
import Filters from './Filters'
import Chart from 'chart.js'
import chartUtils from '../assets/chart-utils.js'

export default {
  components: { DataTable, Filters },
  data() {
    return { ready: false, chartTop: 0, chart: null }
  },
  computed: {
    ...mapState(['data']),
    ...mapGetters(['incompleteConfig', 'config']),
    dimension() {
      return { height: window.innerHeight - this.chartTop, width: window.innerWidth }
    }
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
      this.$store.commit('setAny', { error: new Error('La configuration est insuffisante pour présenter un graphique') })
    }
  },
  async mounted() {
    this.ready = true
    await this.$nextTick()
    const chartEl = this.$el.querySelector('#myChart')
    if (chartEl) this.chartTop = chartEl.getBoundingClientRect().top
    await this.$nextTick()
    this.renderChart()
  },
  methods: {
    renderChart() {
      if (!this.ready || !this.data || this.incompleteConfig || this.config.chart.type === 'table') return
      try {
        if (!this.chart) {
          this.chart = new Chart(document.getElementById('myChart'), chartUtils.prepareChart(this.config, this.data))
        } else {
          this.chart.data = chartUtils.prepareData(this.config, this.data)
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
