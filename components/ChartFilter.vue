<template lang="html">
  <v-autocomplete
    :items="items"
    v-model="filter.value"
    :label="`Filtrer par ${configFilter.field.label}`"
    :loading="loading"
    :search-input.sync="search"
    :clearable="true"
    :filter="() => true"
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

      const qs = Object.keys(appliedFilters)
        .filter(key => ![null, undefined, ''].includes(appliedFilters[key]))
        .map(key => `${key}:${appliedFilters[key]}`)
        .join(' AND ')

      this.items = await this.$axios.$get(this.config.datasets[0].href + '/values/' + this.configFilter.field.key, { params: {
        size: 10,
        qs,
        q: this.search ? this.search + '*' : ''
      } })
      this.loading = false
    }
  }
}
</script>

<style lang="css">
</style>
