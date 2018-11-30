<template>
  <v-layout align-center class="mt-4">
    <v-flex text-xs-center>
      <img src="https://cdn.rawgit.com/koumoul-dev/data-fair/master/public/assets/logo.svg">
      <h3 class="display-3">data-fair-charts</h3>
      <p>Une application simple de graphiques pour data-fair.</p>
      <v-btn href="https://github.com/koumoul-dev/data-fair-charts" target="_blank">Github</v-btn>
      <v-btn :href="defaultConfigureUrl">Utiliser sur {{ defaultDataFairUrl.host }}</v-btn>
    </v-flex>
  </v-layout>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters(['defaultDataFairUrl', 'defaultConfigureUrl'])
  }
}
</script>

<style>
</style>
