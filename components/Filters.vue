<template lang="html">
  <v-container fluid pa-2 grid-list-sm>
    <v-layout row wrap>
      <v-flex v-for="(dynamicFilter, i) in config.filters.dynamicFilters" :key="i" xs12 sm6 md4>
        <chart-filter :indice="i"/>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import ChartFilter from './ChartFilter'
import { mapGetters, mapState } from 'vuex'

export default {
  components: { ChartFilter },
  computed: {
    ...mapGetters(['config']),
    ...mapState(['application'])
  }
}
</script>

<style lang="css">
</style>
