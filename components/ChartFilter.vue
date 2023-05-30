<template lang="html">
  <v-autocomplete
    :items="dynamicFilter.values.concat(items)"
    :value="dynamicFilter.values"
    :label="`Filtrer par ${dynamicFilter.field.label}`"
    :loading="loading"
    :search-input.sync="search"
    :clearable="true"
    :multiple="true"
    :filter="() => true"
    class="chart-filter"
    hide-no-data
    placeholder="Saisissez une valeur"
    @change="applyFilter"
  />
</template>

<script>
import { mapGetters, mapActions, mapState } from 'vuex'
import { filters2qs } from '../assets/filters-utils'
export default {
  props: ['indice'],
  data() {
    return { loading: false, search: '', items: null }
  },
  computed: {
    ...mapGetters(['config']),
    ...mapState(['filters']),
    dynamicFilter() {
      return this.config.dynamicFilters[this.indice]
    },
    higherFilters() {
      return this.config.dynamicFilters.slice(0, this.indice)
    }
  },
  watch: {
    search(val, oldVal) {
      if (val === oldVal && this.items !== null) return
      this.fetchItems()
    },
    higherFilters: {
      handler() {
        this.dynamicFilter.values = this.dynamicFilter.defaultValues || []
        this.search = ''
        this.fetchItems()
      },
      deep: true
    }
  },
  created() {
    this.$set(this.dynamicFilter, 'values', this.dynamicFilter.defaultValues || [])
  },
  methods: {
    ...mapActions(['fetchData']),
    async fetchItems() {
      if (this.loading) return
      this.loading = true
      const qs = filters2qs(this.config.staticFilters.concat(this.higherFilters))
      this.items = await this.$axios.$get(this.config.datasets[0].href + '/values/' + encodeURIComponent(this.dynamicFilter.field.key), { params: {
        size: 10,
        qs,
        q: this.search ? this.search + '*' : ''
      } })
      this.loading = false
    },
    applyFilter(values) {
      const newQuery = { ...this.$route.query }
      if (values && values.length) newQuery[this.dynamicFilter.field.key + '_in'] = JSON.stringify(values).slice(1, -1)
      else delete newQuery[this.dynamicFilter.field.key + '_in']
      this.$router.replace({ query: newQuery })
    }
  }
}
</script>

<style lang="css">
.chart-filter .v-text-field__details {
  display: none;
}
</style>
