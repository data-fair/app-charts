<script setup>
import useAppInfo from '@/composables/useAppInfo'
import reactiveSearchParams from '@data-fair/lib/vue/reactive-search-params-global.js'
import { filters } from '../context.js'

const { chart, dynamicMetric } = useAppInfo()
if (dynamicMetric) reactiveSearchParams.metric = chart.config.valueCalc.metric
if (chart.config.dynamicSort) {
  reactiveSearchParams['sort-by'] = chart.config.sortBy
  reactiveSearchParams['sort-order'] = chart.config.sortOrder
}

const metrics = [
  { value: 'avg', title: 'Moyenne' },
  { value: 'min', title: 'Valeur minimale' },
  { value: 'max', title: 'Valeur maximale' },
  { value: 'sum', title: 'Somme' }
]

const sorts = [
  {
    value: 'value',
    title: 'Valeur'
  },
  {
    value: 'label',
    title: 'Libellé'
  }
]

if (chart?.config.type === 'rowsBased') {
  sorts.push({
    value: 'row',
    title: 'Ligne'
  })
}
</script>

<template lang="html">
  <v-container>
    <v-row>
      <v-col
        v-for="(filter, i) in filters"
        :key="i"
        cols="12"
        sm="6"
        md="4"
        class="pb-0"
      >
        <v-autocomplete
          v-model="filter.value.value"
          :dense="$vuetify.display.width < 960"
          :loading="filter.loading.value"
          :label="filter.label"
          :items="filter.items.value"
          placeholder="Saisissez une valeur"
          hide-no-data
          multiple
          clearable
          persistent-clear
          variant="outlined"
          density="compact"
          @update:search="filter.search"
        />
      </v-col>
      <v-col
        v-if="dynamicMetric"
        cols="12"
        sm="6"
        md="4"
        class="pb-0"
      >
        <v-select
          v-model="reactiveSearchParams.metric"
          label="Métrique"
          density="compact"
          variant="outlined"
          :items="metrics"
        />
      </v-col>
      <v-col
        v-if="chart.config.dynamicSort"
        cols="12"
        sm="6"
        md="4"
        class="pb-0"
      >
        <v-select
          v-model="reactiveSearchParams['sort-by']"
          :items="sorts"
          label="Trier par"
          density="compact"
          variant="outlined"
        >
          <template #append>
            <v-btn-toggle
              v-model="reactiveSearchParams['sort-order']"
              mandatory
              border
              density="compact"
            >
              <v-btn
                icon="mdi-sort-ascending"
                value="asc"
              />
              <v-btn
                icon="mdi-sort-descending"
                value="desc"
              />
            </v-btn-toggle>
          </template>
        </v-select>
      </v-col>
    </v-row>
  </v-container>
</template>
