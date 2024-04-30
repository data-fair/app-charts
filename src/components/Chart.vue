<script setup>
import { getData } from '../context.js'
import Actions from './Actions.vue'
import useAppInfo from '@/composables/useAppInfo'
import { ref, computed } from 'vue'
import { computedAsync } from '@vueuse/core'
import { useTheme } from 'vuetify'
import reactiveSearchParams from '@data-fair/lib/vue/reactive-search-params-global.js'

import { Line, Bar, Pie, Radar } from 'vue-chartjs'
import {
  Chart as ChartJS, Title, Tooltip, Legend,
  BarElement, PointElement, ArcElement, LineElement,
  CategoryScale, LinearScale, RadialLinearScale, Filler
} from 'chart.js'
ChartJS.register(Title, Tooltip, Legend,
  BarElement, PointElement, ArcElement, LineElement,
  CategoryScale, LinearScale, RadialLinearScale, Filler)

const { config, chart, dynamicFilters, dynamicMetric } = useAppInfo()
const theme = useTheme()

const loading = ref(false)

const options = computed(() => {
  const options = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        display: !!chart.config.colors
      },
      title: {
        display: !!config.title,
        text: config.title
      }
    }
  }

  options.scales = {
    x: {
      stacked: reactiveSearchParams.stacked === 'true'
    },
    y: {
      stacked: reactiveSearchParams.stacked === 'true'
    }
  }

  if (chart.tension != null) {
    options.elements = {
      line: {
        tension: chart.tension / 10
      }
    }
  }

  if (chart.horizontal) options.indexAxis = 'y'
  return options
})

const data = computedAsync(getData(theme)[chart.config.type], null, loading)

</script>

<template lang="html">
  <div style="display:flex;flex-direction:column;">
    <Actions v-if="dynamicFilters || dynamicMetric || chart.config.dynamicSort" />
    <div
      v-if="data"
      style="flex:1"
    >
      <Line
        v-if="['line', 'multi-line'].includes(chart.type)"
        :options="options"
        :data="data"
      />
      <Bar
        v-else-if="['bar', 'multi-bar'].includes(chart.type)"
        :options="options"
        :data="data"
      />
      <div
        v-else
        class="h-screen"
        style="display: flex;align-items: center;justify-content: center;"
      >
        <Pie
          v-if="chart.type === 'pie'"
          :options="options"
          :data="data"
        />
        <Radar
          v-else-if="chart.type === 'radar'"
          :options="options"
          :data="data"
        />
      </div>
    </div>
  </div>
</template>
