<script setup>
import { getData } from '../context.js'
import Actions from './Actions.vue'
import useAppInfo from '@/composables/useAppInfo'
import { ref } from 'vue'
import { computedAsync } from '@vueuse/core'
import { useTheme } from 'vuetify'

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

const options = {
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

if (chart.stacked || chart.type === 'multi-area') {
  options.scales = {
    x: {
      stacked: true
    },
    y: {
      stacked: true
    }
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

const data = computedAsync(getData(theme)[chart.config.type], null, loading)

</script>

<template lang="html">
  <template v-if="data">
    <Line
      v-if="['line', 'area', 'multi-line', 'multi-area'].includes(chart.type)"
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
  </template>
  <Actions v-if="dynamicFilters || dynamicMetric || chart.config.dynamicSort" />
</template>
