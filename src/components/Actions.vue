<script setup>
import useAppInfo from '@/composables/useAppInfo'
import reactiveSearchParams from '@data-fair/lib/vue/reactive-search-params-global.js'
import { mdiSortVariant, mdiSortReverseVariant } from '@mdi/js'

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

if (chart?.config.type?.replace('Categories', '') === 'rowsBased') {
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
                :icon="mdiSortReverseVariant"
                value="asc"
              />
              <v-btn
                :icon="mdiSortVariant"
                value="desc"
              />
            </v-btn-toggle>
          </template>
        </v-select>
      </v-col>
      <v-col
        v-if="['multi-bar', 'multi-line'].includes(chart.type) && (!chart.disableDynamicStack && !chart.percentage)"
        cols="12"
        sm="6"
        md="4"
        class="pb-0"
      >
        <v-switch
          v-model="reactiveSearchParams['stacked']"
          false-value="false"
          true-value="true"
          label="Empiler"
          density="compact"
          variant="outlined"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<style>
.v-icon {
transform:rotate(270deg);
}
</style>
