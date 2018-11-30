<template lang="html">
  <v-autocomplete
    :items="dynamicFilter.values.concat(items)"
    v-model="dynamicFilter.values"
    :label="`Filtrer par ${dynamicFilter.field.label}`"
    :loading="loading"
    :search-input.sync="search"
    :clearable="true"
    :multiple="true"
    :filter="() => true"
    hide-no-data
    placeholder="Saisissez une valeur"
    @change="fetchData()"
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
      return this.config.filters.dynamicFilters[this.indice]
    },
    higherFilters() {
      return this.config.filters.dynamicFilters.slice(0, this.indice)
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
      const qs = filters2qs(this.config.filters.staticFilters.concat(this.higherFilters))
      this.items = await this.$axios.$get(this.config.datasets[0].href + '/values/' + this.dynamicFilter.field.key, { params: {
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
