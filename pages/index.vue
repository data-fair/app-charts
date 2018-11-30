<template>
  <chart v-if="application"/>
</template>

<script>
import { mapState } from 'vuex'
import Chart from '../components/Chart'

export default {
  components: { Chart },
  computed: {
    ...mapState(['application'])
  },
  created() {
    // Better use a redirect than v-if / v-else so that we don't load vuetify here
    if (!this.application) this.$router.push('/about')
  }
}
</script>

<style>
</style>
