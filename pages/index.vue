<template>
  <v-container fluid class="pa-0">
    <!-- Display a banner if application is opened from its original web server instead
    of through a data application's proxy -->

    <v-layout v-if="!application" align-center class="mt-4">
      <v-flex text-xs-center>
        <img src="https://cdn.rawgit.com/koumoul-dev/data-fair/master/public/assets/logo.svg">
        <h3 class="display-3">data-fair-charts</h3>
        <p>Une application simple de graphiques pour data-fair.</p>
        <v-btn href="https://github.com/koumoul-dev/data-fair-charts" target="_blank">Github</v-btn>
        <v-btn :href="defaultConfigureUrl">Utiliser sur {{ defaultDataFairUrl.host }}</v-btn>
      </v-flex>
    </v-layout>

    <!-- Actually render the application -->
    <chart v-else/>

  </v-container>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import Chart from '../components/Chart'

export default {
  components: { Chart },
  computed: {
    ...mapState(['env', 'application']),
    ...mapGetters(['defaultDataFairUrl', 'defaultConfigureUrl'])
  }
}
</script>

<style>
</style>
