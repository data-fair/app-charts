<template lang="html">
  <v-container fluid class="pa-0">
    <p v-if="incompleteConfig">La configuration est insuffisante pour présenter un graphique.</p>
    <data-table v-else-if="config.chart.type === 'table'" />
    <canvas id="myChart" :height="dimension.height" :width="dimension.width"/>
  </v-container>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import DataTable from './DataTable'
import Chart from 'chart.js'
import chartUtils from '../assets/chart-utils.js'

export default {
  components: { DataTable },
  data() {
    return { ready: false }
  },
  computed: {
    ...mapState(['data']),
    ...mapGetters(['incompleteConfig', 'config']),
    dimension() {
      return { height: window.innerHeight, width: window.innerWidth }
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
  mounted() {
    this.ready = true
    this.renderChart()
  },
  methods: {
    renderChart() {
      if (!this.ready || !this.data || this.incompleteConfig || this.config.chart.type === 'table') return
      try {
        new Chart(document.getElementById('myChart'), chartUtils.prepareChart(this.config, this.data))
      } catch (err) {
        return this.$store.dispatch('setError', err)
      }
    }
  }
}
</script>

<style lang="css">
</style>
