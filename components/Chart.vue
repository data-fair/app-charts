<template lang="html">
  <v-container fluid>
    <p v-if="incompleteConfig">La configuration est insuffisante.</p>
    <data-table v-else-if="appConfig.chartType === 'table'" :result="result" />
    <bar-chart v-else-if="appConfig.chartType === 'bars'" :result="result" :size="size" />
  </v-container>
</template>

<script>
import {mapState} from 'vuex'
import DataTable from './DataTable'
import BarChart from './BarChart'
const TWEEN = require('tween.js')

export default {
  components: {DataTable, BarChart},
  data() {
    return {
      result: null,
      metricLabel: null,
      incompleteConfig: null,
      size: {width: 0, height: 0}
    }
  },
  computed: {
    ...mapState('data-fair', ['appConfig', 'datasets'])
  },
  watch: {
    appConfig() {
      this.fetchData()
    },
    'datasets.main'() {
      this.fetchData()
    }
  },
  created() {
    this.fetchData()
  },
  mounted() {
    this.resize()
    window.addEventListener('resize', this.resize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resize)
  },
  methods: {
    async fetchData() {
      if (
        !this.appConfig.datasets.find(d => d.key === 'main') ||
        !this.appConfig.aggType || !this.appConfig.aggField ||
        !this.appConfig.metricType || (this.appConfig.metricType !== 'count' && !this.appConfig.metricField)
      ) {
        this.incompleteConfig = true
      } else {
        this.incompleteConfig = false
      }
      if (!this.datasets.main) return

      const params = {
        field: this.appConfig.aggField,
        agg_size: 10
      }
      if (this.appConfig.metricType !== 'count') {
        params.metric = this.appConfig.metricType
        params.metric_field = this.appConfig.metricField
        this.metricLabel = this.appConfig.metricType
      }
      try {
        this.result = await this.$axios.$get(this.datasets.main.href + '/values_agg', {params})
      } catch (error) {
        this.$store.dispatch('notification/queue', {error, msg: 'Échec de récupération des données.'})
      }
    },
    resize() {
      this.size.width = this.$el.offsetWidth
      // Simple animation by changing height of all charts
      if (this.heightTween) this.heightTween.stop()
      this.heightTween = new TWEEN.Tween(this.size)
        .to({height: this.size.width * 0.6}, 350)
        .easing(TWEEN.Easing.Cubic.Out)
        .onUpdate(() => {
          console.log('TWEEN!')
        })
        .start()
    }
  }
}
</script>

<style lang="css">
</style>
