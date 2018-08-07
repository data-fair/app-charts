<template lang="html">
  <v-container>
    <v-layout row>
      <v-flex v-if="editConfig" xs12 md6>
        <v-layout column>
          <v-autocomplete
            :items="datasetsRefs"
            :loading="loadingDatasets"
            v-model="editConfig.datasets[0]"
            :search-input.sync="datasetsFilter"
            label="Jeu de données"
            placeholder="Commencez à saisir le titre d'un jeu de données"
            item-value="href"
            return-object
            item-text="name"
            hide-no-data
          />

          <v-select
            :items="[{value: 'table', text: 'Table'}, {value: 'bars', text: 'Histogramme'}]"
            v-model="editConfig.chartType"
            label="Type de rendu"
          />

          <v-select
            v-if="datasets.main"
            :items="datasets.main.schema.filter(field => (field.format === 'uri-reference'))"
            v-model="editConfig.aggField"
            :item-text="field => (field.title || field['x-originalName'])"
            item-value="key"
            label="Champ sur lequel grouper les valeurs"
          />

          <v-select
            :items="metricTypes"
            v-model="editConfig.metricType"
            label="Calcul de la valeur"
          />

          <v-select
            v-if="datasets.main && editConfig.metricType !== 'count'"
            :items="datasets.main.schema.filter(field => (['number', 'integer'].includes(field.type)))"
            v-model="editConfig.metricField"
            :item-text="field => (field.title || field['x-originalName'])"
            item-value="key"
            label="Champ sur lequel appliquer le calcul"
          />

          <v-layout row>
            <v-spacer/>
            <v-btn color="primary" @click="saveAppConfig(editConfig)">Enregistrer</v-btn>
          </v-layout>

        </v-layout>
      </v-flex>
      <v-flex xs12 md6>
        <chart />
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import {mapState, mapActions} from 'vuex'
import Chart from '../components/Chart'

export default {
  components: {Chart},
  data() {
    return {
      editConfig: null,
      loadingDatasets: false,
      datasetsList: [],
      datasetsFilter: null
    }
  },
  computed: {
    ...mapState('data-fair', ['ready', 'dataFairConfig', 'appConfig', 'datasets']),
    ...mapState(['metricTypes']),
    datasetsRefs() {
      return this.datasetsList.map(d => ({href: d.href, name: `${d.title} (${d.owner.name})`, key: 'main'}))
    }
  },
  watch: {
    appConfig() {
      this.initEditConfig()
    },
    async datasetsFilter(val) {
      if (val === this.editConfig.datasets[0].name) return
      this.searchDatasets()
    }
  },
  created() {
    this.initEditConfig()
    this.searchDatasets()
  },
  methods: {
    ...mapActions('data-fair', ['saveAppConfig']),
    initEditConfig() {
      const config = JSON.parse(JSON.stringify(this.appConfig))
      config.datasets[0] = config.datasets[0] || {href: null, key: 'main'}
      config.chartType = config.chartType || 'table'
      config.aggType = config.aggType || 'values'
      config.aggField = config.aggField || null
      config.metricType = config.metricType || 'count'
      config.metricField = config.metricField || null
      this.editConfig = config
    },
    async searchDatasets() {
      this.datasetsList = (await this.$axios.$get('/datasets', {params: {select: 'title', q: this.datasetsFilter}})).results
    }
  }
}
</script>

<style lang="css">
</style>
