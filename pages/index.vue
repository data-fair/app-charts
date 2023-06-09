<template>
  <chart v-if="application" />
</template>

<script>
import { mapState, mapActions } from 'vuex'
import Chart from '../components/Chart'

export default {
  components: { Chart },
  computed: {
    ...mapState(['application'])
  },
  watch: {
    '$route.query': {
      immediate: true,
      handler () {
        const conceptFilters = {}
        // eslint-disable-next-line no-unused-vars
        for (const key in this.$route.query) {
          if (key.startsWith('_c_')) {
            conceptFilters[key] = this.$route.query[key]
          }
        }
        this.$store.commit('setAny', { conceptFilters })
        this.fetchData()
      }
    }
  },
  created() {
    // Better use a redirect than v-if / v-else so that we don't load vuetify here
    if (!this.application) this.$router.push('/about')
  },
  methods: {
    ...mapActions(['fetchData'])
  }
}
</script>

<style>
</style>
