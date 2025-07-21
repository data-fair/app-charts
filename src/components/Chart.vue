<script setup>
import { useChartData } from '@/composables/useChartData.js'
import Actions from './Actions.vue'
import { useConfig } from '@/composables/config'
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
import OutLabels from '@energiency/chartjs-plugin-piechart-outlabels'
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm'
import 'dayjs/locale/fr'
dayjs.locale('fr')
ChartJS.register(Title, Tooltip, Legend,
  BarElement, PointElement, ArcElement, LineElement,
  CategoryScale, LinearScale, RadialLinearScale, TimeScale, Filler)

const { config, chart, dynamicMetric } = useConfig()
const theme = useTheme()
const loading = ref(false)
const { getData } = useChartData()

const options = computed(() => {
  const options = {
    maintainAspectRatio: false,
    responsive: true,
    locale: 'fr',
    plugins: {
      legend: {
        display: chart.value.type !== 'pie' && !!chart.value.config.colors &&
        !(chart.value.config.groupBy?.type === 'value' && chart.value.config.groupBy.field?.key === chart.value.config.groupsField?.key),
        position: config.value.legendPosition || 'top'
      },
      title: {
        display: !!config.value.title,
        text: config.value.title
      },
      tooltip: {
        enabled: !config.value.disableTooltip,
        callbacks: {
          label: context => {
            return (context.dataset.label ? context.dataset.label + ' : ' : '') + ((chart.value.horizontal ? context.parsed.x : context.parsed.y) || context.parsed.r).toLocaleString('fr') + (config.value.unit ? ' ' + config.value.unit : '')
          }
        }
      }
    }
  }
  if (chart.value.cutout) options.cutout = chart.value.cutout + '%'

  options.scales = {
    x: {
      stacked: chart.value.type === 'paired-histogram' || chart.value.config.categoriesField || reactiveSearchParams.stacked === 'true'
    },
    y: {
      stacked: chart.value.type === 'paired-histogram' || chart.value.config.categoriesField || reactiveSearchParams.stacked === 'true'
    }
  }
  if (config.value.xTitle?.length) {
    options.scales.x.title = {
      text: config.value.xTitle,
      display: true,
      font: {
        weight: 'bold'
      }
    }
  }
  if (config.value.yTitle?.length) {
    options.scales.y.title = {
      text: config.value.yTitle,
      display: true,
      font: {
        weight: 'bold'
      }
    }
  }
  if ((chart.value?.config.groupBy && chart.value?.config.groupBy.type === 'date') || (chart.value?.config.labelsField && chart.value?.config.labelsField.format === 'date')) {
    options.scales.x.type = 'time'
  }
  if (chart.value.yAxisStartsZero) {
    options.scales.y.min = 0
  } else if (chart.value.yAxisNotStartsZero) {
    options.scales.y.beginAtZero = false
  }
  if (chart.value.percentage) {
    options.scales.y.ticks = {
      callback: v => v + ' %'
    }
  } else if (config.value.unit && chart.value.type !== 'paired-histogram') {
    if (chart.value.horizontal) {
      options.scales.x.ticks = {
        callback: v => v.toLocaleString('fr') + ' ' + config.value.unit
      }
    } else {
      options.scales.y.ticks = {
        callback: v => v.toLocaleString('fr') + ' ' + config.value.unit
      }
    }
  }
  if (chart.value.hideYAxis) {
    options.scales[chart.value.horizontal ? 'y' : 'x'].grid = { display: false }
    options.scales[chart.value.horizontal ? 'x' : 'y'].display = false
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
        return value ? value.toLocaleString('fr') + (config.value.unit ? ' ' + config.value.unit : '') : ''
      }
    }
    ChartJS.register(ChartDataLabels)
    options.layout = { padding: chart.value.horizontal ? { right: 64 } : { top: 24 } }
  }
  if (chart.value.type === 'pie') {
    ChartJS.register(OutLabels)
    if (config.value.title || chart.value.sumInTitle) {
      options.plugins.title.padding = { top: 0, bottom: 48 }
      options.layout = { padding: { top: 0, left: 48, right: 48, bottom: 48 } }
    } else {
      options.layout = { padding: 48 }
    }
    if (chart.value.sumInTitle) {
      options.plugins.title.display = true
      options.plugins.title.text = function (context) {
        const data = context.chart.data.datasets[0].data
        const sum = data.reduce((acc, v) => acc + v, 0)
        return (config.value.title ? config.value.title + ' : ' : '') + sum.toLocaleString('fr') + (config.value.unit ? ' ' + config.value.unit : '')
      }
    }
    options.rotation = chart.value.rotation || 0
    options.scales.x.display = false
    options.scales.y.display = false
    options.plugins.outlabels = {
      borderWidth: 1,
      borderRadius: 4,
      font: {
        weight: 'bold',
        size: 16,
        lineHeight: 0.8,
        resizable: false
      },
      textAlign: 'center',
      padding: { left: 8, right: 8, top: 0, bottom: 0 },
      borderColor: function (context) {
        return chroma(context.dataset.backgroundColor[context.dataIndex]).darken().hex()
      },
      backgroundColor: function (context) {
        return context.dataset.backgroundColor[context.dataIndex]
      },
      color: function (context) {
        return chroma(context.dataset.backgroundColor[context.dataIndex]).luminance() < 0.4 ? 'white' : 'black'
      },
      text: function (context) {
        const index = context.dataIndex
        const value = context.dataset.data[index]

        const lines = [context.dataset.labels[index]]
        if (['values', 'both'].includes(chart.value.display)) {
          lines.push(value.toLocaleString('fr') + (config.value.unit ? ' ' + config.value.unit : ''))
        }
        if (['percentages', 'both'].includes(chart.value.display)) {
          lines.push(context.dataset.percentages[index].toLocaleString('fr') + ' %')
        }
        return lines.join('\n')
      }
    }
    options.plugins.tooltip.callbacks = {
      label: context => context.parsed.toLocaleString('fr') + (config.value.unit ? ' ' + config.value.unit : '')
    }
  }

  if (chart.value.tension != null) {
    options.elements = {
      line: {
        tension: chart.value.tension / 10
      }
    }
  }

  if (chart.value.horizontal) {
    options.indexAxis = 'y'
  }

  if (chart.value.type === 'paired-histogram') {
    options.indexAxis = 'y'
    options.scales.x = {
      ticks: {
        callback: (v) => (v < 0 ? -v : v).toLocaleString('fr') + (config.value.unit ? ' ' + config.value.unit : '')
      }
    }
    options.plugins.tooltip = {
      callbacks: {
        label: (c) => {
          const value = Number(c.raw)
          const positiveOnly = value < 0 ? -value : value
          return `${c.dataset.label}: ${positiveOnly.toLocaleString('fr')}` + (config.value.unit ? ' ' + config.value.unit : '')
        }
      }
    }
  }
  if (chart.value.type === 'radar') {
    if (config.value.unit) {
      options.scales = {
        r: {
          ticks: {
            callback: v => v + ' ' + config.value.unit
          }
        }
      }
    } else delete options.scales
  }
  return options
})

const data = computedAsync(getData(theme)[chart.value.config.type?.replace('Categories', '')], null, loading)
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
