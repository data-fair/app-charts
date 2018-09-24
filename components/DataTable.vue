<template lang="html">
  <v-data-table
    :headers="headers"
    :items="items"
    :loading="!data"
    hide-actions
    disable-initial-sort
    class="elevation-1"
  >
    <template slot="items" slot-scope="props">
      <td>{{ props.item.value }}</td>
      <td class="text-xs-right">{{ props.item.total }}</td>
      <td v-if="config.metricType !== 'count'" class="text-xs-right">{{ props.item.metric }}</td>
    </template>
  </v-data-table>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import chartUtils from '../assets/chart-utils.js'

export default {
  props: ['result'],
  computed: {
    ...mapGetters(['config']),
    ...mapState(['application', 'data']),
    headers() {
      const headers = [{ value: 'value', text: 'Valeur' }, { value: 'total', text: 'Nombre de documents' }]
      if (this.config.metricType === 'count') {
        return headers
      } else {
        return headers.concat([{ value: 'metric', text: this.metricLabel }])
      }
    },
    items() {
      if (!this.data) return []
      return this.data.aggs.concat([{ value: 'Autres', total: this.data.total_other }])
    },
    metricLabel() {
      return chartUtils.metricLabel(this.config)
    }
  }
}
</script>

<style lang="css">
</style>
