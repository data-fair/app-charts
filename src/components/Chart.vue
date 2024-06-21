<script setup>
import { getData } from '../context.js'
import Actions from './Actions.vue'
import useAppInfo from '@/composables/useAppInfo'
import { ref, computed } from 'vue'
import { computedAsync } from '@vueuse/core'
import { useTheme } from 'vuetify'
import reactiveSearchParams from '@data-fair/lib/vue/reactive-search-params-global.js'
import dayjs from 'dayjs'

import { Line, Bar, Pie, Radar } from 'vue-chartjs'
import {
  Chart as ChartJS, Title, Tooltip, Legend,
  BarElement, PointElement, ArcElement, LineElement,
  CategoryScale, LinearScale, RadialLinearScale, TimeScale, Filler
} from 'chart.js'
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm'
import 'dayjs/locale/fr'
dayjs.locale('fr')
ChartJS.register(Title, Tooltip, Legend,
  BarElement, PointElement, ArcElement, LineElement,
  CategoryScale, LinearScale, RadialLinearScale, TimeScale, Filler)

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
      stacked: chart.type === 'paired-histogram' || reactiveSearchParams.stacked === 'true'
    },
    y: {
      stacked: chart.type === 'paired-histogram' || reactiveSearchParams.stacked === 'true'
    }
  }
  if ((chart?.config.groupBy && chart?.config.groupBy.type === 'date') || (chart?.config.labelsField && chart?.config.labelsField.format === 'date')) {
    options.scales.x.type = 'time'
  }
  if (chart.yAxisStartsZero) {
    options.scales.y.min = 0
  }
  if (chart.percentage) {
    options.scales.y.ticks = {
      callback: v => v + ' %'
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

  if (chart.type === 'paired-histogram') {
    options.indexAxis = 'y'
    options.scales.x = {
      ticks: {
        callback: (v) => v < 0 ? -v : v
      }
    }
    options.plugins.tooltip = {
      callbacks: {
        label: (c) => {
          const value = Number(c.raw)
          const positiveOnly = value < 0 ? -value : value
          return `${c.dataset.label}: ${positiveOnly.toString()}`
        }
      }
    }
  }
  return options
})

const data = computedAsync(getData(theme)[chart.config.type], null, loading)
</script>

<template lang="html">
  <div style="display:flex;flex-direction:column;">
    <Actions
      v-if="dynamicFilters || dynamicMetric || chart.config.dynamicSort || ['multi-bar', 'multi-line'].includes(chart.type)"
    />
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
        v-else-if="['bar', 'multi-bar', 'paired-histogram'].includes(chart.type)"
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
