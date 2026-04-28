<script setup lang="ts">
import { useConfig } from '@/composables/config'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import { mdiSortVariant, mdiSortReverseVariant } from '@mdi/js'
import { watch, computed } from 'vue'

const { chart, dynamicMetric, fields } = useConfig()

watch(() => chart.value?.config, (chartConfig) => {
  if (dynamicMetric.value && chartConfig?.valueCalc?.metric) {
    reactiveSearchParams.metric = chartConfig.valueCalc.metric
  }
  if (chartConfig?.dynamicSort) {
    reactiveSearchParams['sort-by'] = chartConfig.sortBy
    reactiveSearchParams['sort-order'] = chartConfig.sortOrder
    if (chartConfig.sortField) reactiveSearchParams['sort-field'] = chartConfig.sortField
    else delete reactiveSearchParams['sort-field']
  } else {
    delete reactiveSearchParams['sort-by']
    delete reactiveSearchParams['sort-order']
    delete reactiveSearchParams['sort-field']
  }
}, { immediate: true, deep: true })

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

if (chart.value?.config.type?.replace('Categories', '') === 'rowsBased') {
  sorts.push({
    value: 'row',
    title: 'Ligne'
  })
}

const showSortField = computed(() => {
  const sortBy = reactiveSearchParams['sort-by'] || chart.value?.config.sortBy
  return sortBy === 'value' && chart.value?.config.type === 'aggsBasedCategories' && chart.value?.config.valuesCalc?.length > 1
})

const sortFieldItems = computed(() => {
  return chart.value?.config.valuesCalc?.map((field: string) => ({
    value: field,
    title: fields.value[field]?.title || fields.value[field]?.label || field
  })) || []
})

</script>

<template lang="html">
  <v-container class="actions-container">
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
        v-if="chart.config.dynamicSort && showSortField"
        cols="12"
        sm="6"
        md="4"
        class="pb-0"
      >
        <v-select
          v-model="reactiveSearchParams['sort-field']"
          :items="sortFieldItems"
          label="Champ de tri"
          density="compact"
          variant="outlined"
        />
      </v-col>
      <v-col
        v-if="['multi-bar', 'multi-line'].includes(chart.type as string) && (!chart.disableDynamicStack && !chart.percentage)"
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

<style scoped>
.actions-container .v-btn-toggle .v-icon {
  transform: rotate(270deg);
}
</style>
