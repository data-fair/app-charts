<template>
  <v-layout align-center class="mt-4">
    <v-flex text-xs-center>
      <img src="https://cdn.rawgit.com/data-fair/data-fair/master/public/assets/logo.svg">
      <h3 class="display-3">
        data-fair-charts
      </h3>
      <p>Une application simple de graphiques pour data-fair.</p>
      <v-btn href="https://github.com/data-fair/app-charts" target="_blank">
        Github
      </v-btn>
      <v-btn :href="defaultConfigureUrl" v-if="complete">
        Utiliser sur {{ defaultDataFairUrl.host }}
      </v-btn>
    </v-flex>
  </v-layout>
</template>

<script>
import { computed } from 'vue'
import useMainStore from '@/stores/useMainStore'

export default {
  setup() {
    const store = useMainStore()
    let complete = true

    if (!store.incompleteConfig) {
      complete = false
      const defaultDataFairUrl = new URL('https://data-fair.github.io/3/user-guide-backoffice/charts')
      const defaultConfigureUrl = new URL('https://data-fair.github.io/3/user-guide-backoffice/charts')
      return {
        defaultDataFairUrl,
        defaultConfigureUrl,
        complete
      }
    }

    const defaultDataFairUrl = computed(() => store.defaultDataFairUrl)
    const defaultConfigureUrl = computed(() => store.defaultConfigureUrl)

    return {
      defaultDataFairUrl,
      defaultConfigureUrl,
      complete
    }
  }
}
</script>

<style>
</style>
