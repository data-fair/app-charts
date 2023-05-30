<template>
  <chart v-if="application"/>
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
