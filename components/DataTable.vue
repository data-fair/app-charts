<template lang="html">
  <v-data-table
    :headers="headers"
    :items="items"
    :loading="!result"
    hide-actions
    disable-initial-sort
    class="elevation-1"
  >
    <template slot="items" slot-scope="props">
      <td>{{ props.item.value }}</td>
      <td class="text-xs-right">{{ props.item.total }}</td>
      <td v-if="appConfig.metricType !== 'count'" class="text-xs-right">{{ props.item.metric }}</td>
    </template>
  </v-data-table>
</template>

<script>
import {mapGetters, mapState} from 'vuex'

export default {
  props: ['result'],
  computed: {
    ...mapGetters(['metricLabel']),
    ...mapState('data-fair', ['appConfig']),
    headers() {
      const headers = [{value: 'value', text: 'Valeur'}, {value: 'total', text: 'Nombre de documents'}]
      if (this.appConfig.metricType === 'count') {
        return headers
      } else {
        return headers.concat([{value: 'metric', text: this.metricLabel}])
      }
    },
    items() {
      if (!this.result) return []
      return this.result.aggs.concat([{value: 'Autres', total: this.result.total_other}])
    }
  }
}
</script>

<style lang="css">
</style>
