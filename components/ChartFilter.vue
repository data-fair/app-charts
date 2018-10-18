<template lang="html">
  <v-autocomplete
    :items="items"
    v-model="filter.value"
    :label="`Filtrer par ${configFilter.field.label}`"
    :loading="loading"
    :search-input.sync="search"
    :clearable="true"
    hide-no-data
    placeholder="Saisissez une valeur"
    @change="fetchData()"
  />
</template>

<script>
import { mapGetters, mapActions, mapState } from 'vuex'
export default {
  props: ['indice'],
  data() {
    return { loading: false, search: '', items: null }
  },
  computed: {
    ...mapGetters(['config']),
    ...mapState(['filters']),
    configFilter() {
      return this.config.filters && this.config.filters[this.indice]
    },
    filter() {
      return this.filters && this.filters[this.indice]
    },
    higherFilters() {
      return this.filters.filter((f, i) => i < this.indice)
    }
  },
  watch: {
    search(val, oldVal) {
      if (val === oldVal && this.items !== null) return
      this.fetchItems()
    },
    higherFilters: {
      handler() {
        this.filter.value = null
        this.search = ''
        this.fetchItems()
      },
      deep: true
    }
  },
  created() {
    this.$set(this.filter, 'value', null)
  },
  methods: {
    ...mapActions(['fetchData']),
    async fetchItems() {
      if (this.loading) return
      this.loading = true
      const appliedFilters = {}
      this.higherFilters.forEach(f => {
        appliedFilters[f.field.key] = f.value
      });
      (this.config.staticFilters || []).forEach(sf => {
        appliedFilters[sf.field.key] = sf.value
      })
      if (this.search) {
        appliedFilters[this.configFilter.field.key] = this.search
        if (this.configFilter.field.type === 'string') appliedFilters[this.configFilter.field.key] += '*'
      }
      let qs = Object.keys(appliedFilters)
        .filter(key => ![null, undefined, ''].includes(appliedFilters[key]))
        .map(key => `${key}:${appliedFilters[key]}`).join(' AND ')

      this.items = (await this.$axios.$get(this.config.datasets[0].href + '/values_agg', { params: {
        field: this.configFilter.field.key,
        sort: 'key',
        agg_size: 5,
        qs
      } })).aggs.map(agg => agg.value)
      this.loading = false
    }
  }
}
</script>

<style lang="css">
</style>
