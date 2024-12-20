<script setup>
import { getData } from '../context.js'
import Actions from './Actions.vue'
import useAppInfo from '@/composables/useAppInfo'
import { ref, computed } from 'vue'
import { computedAsync } from '@vueuse/core'
import { useTheme } from 'vuetify'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import dayjs from 'dayjs'
import chroma from 'chroma-js'

import { Line, Bar, Pie, Radar } from 'vue-chartjs'
import {
  Chart as ChartJS, Title, Tooltip, Legend,
  BarElement, PointElement, ArcElement, LineElement,
  CategoryScale, LinearScale, RadialLinearScale, TimeScale, Filler
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm'
import 'dayjs/locale/fr'
dayjs.locale('fr')
ChartJS.register(Title, Tooltip, Legend,
  BarElement, PointElement, ArcElement, LineElement,
  CategoryScale, LinearScale, RadialLinearScale, TimeScale, Filler)

const { config, chart, dynamicMetric } = useAppInfo()
const theme = useTheme()

const loading = ref(false)

const options = computed(() => {
  const options = {
    maintainAspectRatio: false,
    responsive: true,
    locale: 'fr',
    plugins: {
      legend: {
        display: chart.type !== 'pie' && !!chart.config.colors &&
        !(chart.config.groupBy?.type === 'value' && chart.config.groupBy.field?.key === chart.config.groupsField?.key)
      },
      title: {
        display: !!config.title,
        text: config.title
      },
      tooltip: {
        enabled: !config.disableTooltip,
        callbacks: {
          label: context => {
            return (context.dataset.label ? context.dataset.label + ' : ' : '') + (context.parsed.y || context.parsed.r).toLocaleString('fr') + (config.unit ? ' ' + config.unit : '')
          }
        }
      }
    }
  }
  if (chart.cutout) options.cutout = chart.cutout + '%'

  options.scales = {
    x: {
      stacked: chart.type === 'paired-histogram' || chart.config.categoriesField || reactiveSearchParams.stacked === 'true'
    },
    y: {
      stacked: chart.type === 'paired-histogram' || chart.config.categoriesField || reactiveSearchParams.stacked === 'true'
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
  } else if (config.unit && chart.type !== 'paired-histogram') {
    if (chart.horizontal) {
      options.scales.x.ticks = {
        callback: v => v.toLocaleString('fr') + ' ' + config.unit
      }
    } else {
      options.scales.y.ticks = {
        callback: v => v.toLocaleString('fr') + ' ' + config.unit
      }
    }
  }
  if (chart.hideYAxis) {
    options.scales[chart.horizontal ? 'y' : 'x'].grid = { display: false }
    options.scales[chart.horizontal ? 'x' : 'y'].display = false
    options.plugins.datalabels = {
      anchor: 'end',
      align: 'end',
      labels: {
        title: {
          font: {
            weight: 'bold'
          }
        }
      },
      formatter: function (value) {
        return value ? value.toLocaleString('fr') + (config.unit ? ' ' + config.unit : '') : ''
      }
    }
    ChartJS.register(ChartDataLabels)
    options.layout = { padding: chart.horizontal ? { right: 64 } : { top: 24 } }
  }
  if (chart.type === 'pie') {
    ChartJS.register(ChartDataLabels)
    if (config.title || chart.sumInTitle) {
      options.plugins.title.padding = { top: 0, bottom: 48 }
      options.layout = { padding: { top: 0, left: 48, right: 48, bottom: 48 } }
    } else {
      options.layout = { padding: 48 }
    }
    if (chart.sumInTitle) {
      options.plugins.title.display = true
      options.plugins.title.text = function (context) {
        const data = context.chart.data.datasets[0].data
        const sum = data.reduce((acc, v) => acc + v, 0)
        return (config.title ? config.title + ' : ' : '') + sum.toLocaleString('fr') + (config.unit ? ' ' + config.unit : '')
      }
    }
    options.rotation = chart.rotation || 0
    options.scales.x.display = false
    options.scales.y.display = false
    options.plugins.datalabels = {
      anchor: 'end',
      align: 'end',
      offset: 8,
      labels: {
        value: {
          font: {
            weight: 'bold',
            size: 13
          }
        }
      },
      borderColor: function (context) {
        return chroma(context.dataset.backgroundColor[context.dataIndex]).darken().hex()
      },
      backgroundColor: function (context) {
        return context.dataset.backgroundColor[context.dataIndex]
      },
      textAlign: 'center',
      color: function (context) {
        return chroma(context.dataset.backgroundColor[context.dataIndex]).luminance() < 0.4 ? 'white' : 'black'
      },
      borderWidth: 1,
      borderRadius: 4,
      padding: { left: 8, right: 8, top: 4, bottom: 4 },
      formatter: function (value, context) {
        const index = context.dataIndex
        const lines = [context.dataset.labels[index]]
        if (['values', 'both'].includes(chart.display)) {
          lines.push(value.toLocaleString('fr') + (config.unit ? ' ' + config.unit : ''))
        }
        if (['percentages', 'both'].includes(chart.display)) {
          lines.push(context.dataset.percentages[index].toLocaleString('fr') + ' %')
        }
        return lines.join('\n')
      }
    }
    options.plugins.tooltip.callbacks = {
      label: context => context.parsed.toLocaleString('fr') + (config.unit ? ' ' + config.unit : '')
    }
  }

  if (chart.tension != null) {
    options.elements = {
      line: {
        tension: chart.tension / 10
      }
    }
  }

  if (chart.horizontal) {
    options.indexAxis = 'y'
  }

  if (chart.type === 'paired-histogram') {
    options.indexAxis = 'y'
    options.scales.x = {
      ticks: {
        callback: (v) => (v < 0 ? -v : v).toLocaleString('fr') + (config.unit ? ' ' + config.unit : '')
      }
    }
    options.plugins.tooltip = {
      callbacks: {
        label: (c) => {
          const value = Number(c.raw)
          const positiveOnly = value < 0 ? -value : value
          return `${c.dataset.label}: ${positiveOnly.toLocaleString('fr')}` + (config.unit ? ' ' + config.unit : '')
        }
      }
    }
  }
  if (chart.type === 'radar') {
    if (config.unit) {
      options.scales = {
        r: {
          ticks: {
            callback: v => v + ' ' + config.unit
          }
        }
      }
    } else delete options.scales
  }
  return options
})

const data = computedAsync(getData(theme)[chart.config.type?.replace('Categories', '')], null, loading)
</script>

<template lang="html">
  <div style="display:flex;flex-direction:column;">
    <Actions
      v-if="dynamicMetric || chart.config.dynamicSort || ['multi-bar', 'multi-line'].includes(chart.type)"
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
