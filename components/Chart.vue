<template lang="html">
  <v-container fluid>
    <p v-if="incompleteConfig">La configuration est insuffisante pour présenter un graphique.</p>
    <data-table v-else-if="application.configuration.chart.type === 'table'" />
  </v-container>
</template>

<script>
import {mapState, mapGetters} from 'vuex'
import DataTable from './DataTable'

export default {
  components: {DataTable},
  data() {
    return {}
  },
  computed: {
    ...mapState(['application']),
    ...mapGetters(['incompleteConfig'])
  }
}
</script>

<style lang="css">
</style>
