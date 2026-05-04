<script setup lang="ts">
import { useChartData } from '@/composables/useChartData'
import Actions from './Actions.vue'
import { useConfig } from '@/composables/config'
import { ref, computed, watch } from 'vue'
import { useTheme } from 'vuetify'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import dayjs from 'dayjs'
import chroma from 'chroma-js'
import { formatDateLabel } from '@/assets/utils'

import { Line, Bar, Pie, Radar } from 'vue-chartjs'
import {
  Chart as ChartJS, Title, Tooltip, Legend,
  BarElement, PointElement, ArcElement, LineElement,
  CategoryScale, LinearScale, RadialLinearScale, TimeScale, Filler
} from 'chart.js'
import type { TooltipItem } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import OutLabels from '@energiency/chartjs-plugin-piechart-outlabels'
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm'
import 'dayjs/locale/fr'
dayjs.locale('fr')
ChartJS.register(Title, Tooltip, Legend,
  BarElement, PointElement, ArcElement, LineElement,
  CategoryScale, LinearScale, RadialLinearScale, TimeScale, Filler,
  ChartDataLabels, OutLabels)

const { config, chart, fields, dynamicMetric } = useConfig()
const theme = useTheme()
const loading = ref(false)
const { getData, queryKey } = useChartData()

// Force chart recreation only for structural changes that Chart.js can't handle in-place:
// - horizontal: switches indexAxis (Chart.js can't swap axes live)
const chartKey = computed(() => JSON.stringify({
  horizontal: chart.value!.horizontal,
}))

const chartFontFamily = computed(() => {
  return getComputedStyle(document.body).fontFamily || getComputedStyle(document.documentElement).fontFamily
})

const options = computed(() => {
  const options: any = {
    maintainAspectRatio: false,
    responsive: true,
    locale: 'fr',
    font: {
      family: chartFontFamily.value
    },
    plugins: {
      legend: {
        display: chart.value!.type !== 'pie' && !!chart.value!.config.colorOrder &&
        !(chart.value!.config.groupBy?.type === 'value' && chart.value!.config.groupBy.field === chart.value!.config.groupsField),
        position: config.value.legendPosition || 'top'
      },
      title: {
        display: !!config.value.title,
        text: config.value.title
      },
      tooltip: {
        enabled: !config.value.disableTooltip,
        callbacks: {
          title: (items: TooltipItem<'line' | 'bar' | 'pie' | 'radar'>[]) => {
            return items[0].label
          },
          label: (context: TooltipItem<'line' | 'bar' | 'pie' | 'radar'>) => {
            return (context.dataset.label ? context.dataset.label + ' : ' : '') + ((chart.value!.horizontal ? context.parsed.x : context.parsed.y) || (context.parsed as unknown as { r: number }).r).toLocaleString('fr') + (config.value.unit ? ' ' + config.value.unit : '')
          }
        }
      }
    }
  }
  if (chart.value!.cutout) (options as Record<string, unknown>).cutout = chart.value!.cutout + '%'

  options.scales = {
    x: {
      stacked: chart.value!.type === 'paired-histogram' || chart.value!.config.categoriesField || reactiveSearchParams.stacked === 'true'
    },
    y: {
      stacked: chart.value!.type === 'paired-histogram' || chart.value!.config.categoriesField || reactiveSearchParams.stacked === 'true'
    }
  }
  if (config.value.xTitle?.length) {
    options.scales!.x!.title = {
      text: config.value.xTitle,
      display: true,
      font: {
        weight: 'bold'
      }
    }
  }
  if (config.value.yTitle?.length) {
    options.scales!.y!.title = {
      text: config.value.yTitle,
      display: true,
      font: {
        weight: 'bold'
      }
    }
  }

  if (chart.value!.yAxisStartsZero !== undefined) {
    options.scales!.y!.beginAtZero = chart.value!.yAxisStartsZero
  }
  if (chart.value!.percentage) {
    if (chart.value!.horizontal) {
      options.scales!.x!.max = 100
      options.scales!.x!.ticks = {
        callback: (v: number) => v + ' %'
      }
    } else {
      options.scales!.y!.max = 100
      options.scales!.y!.ticks = {
        callback: (v: number) => v + ' %'
      }
    }
  } else if (config.value.unit && chart.value!.type !== 'paired-histogram') {
    if (chart.value!.horizontal) {
      options.scales!.x!.ticks = {
        callback: (v: number) => v.toLocaleString('fr') + ' ' + config.value.unit
      }
    } else {
      options.scales!.y!.ticks = {
        callback: (v: number) => v.toLocaleString('fr') + ' ' + config.value.unit
      }
    }
  }
  if (chart.value!.hideYAxis) {
    options.scales![chart.value!.horizontal ? 'y' : 'x']!.grid = { display: false }
    options.scales![chart.value!.horizontal ? 'x' : 'y']!.display = false
    const isStacked = chart.value!.type === 'paired-histogram' || chart.value!.config.categoriesField || reactiveSearchParams.stacked === 'true'
    ;(options.plugins as Record<string, unknown>).datalabels = {
      anchor: isStacked ? 'center' : 'end',
      align: isStacked ? 'center' : 'end',
      labels: {
        title: {
          font: {
            weight: 'bold'
          }
        }
      },
      formatter: function (value: number) {
        if (!value) return ''
        if (chart.value!.percentage) {
          return value.toLocaleString('fr', { maximumFractionDigits: 1, minimumFractionDigits: 1 }) + ' %'
        }
        return value.toLocaleString('fr') + (config.value.unit ? ' ' + config.value.unit : '')
      }
    }
    options.layout = { padding: chart.value!.horizontal ? { right: 64 } : { top: 24 } }
  } else {
    ;(options.plugins as Record<string, unknown>).datalabels = { display: false }
  }
  if (chart.value!.type === 'pie') {
    if (config.value.title || chart.value!.sumInTitle) {
      options.plugins!.title!.padding = { top: 0, bottom: 48 }
      options.layout = { padding: { top: 0, left: 48, right: 48, bottom: 48 } }
    } else {
      options.layout = { padding: 48 }
    }
    if (chart.value!.sumInTitle) {
      options.plugins!.title!.display = true
      ;(options.plugins!.title as Record<string, unknown>).text = function (context: TooltipItem<'pie'>) {
        const data = context.chart.data.datasets[0].data as number[]
        const sum = data.reduce((acc, v) => acc + v, 0)
        return (config.value.title ? config.value.title + ' : ' : '') + sum.toLocaleString('fr') + (config.value.unit ? ' ' + config.value.unit : '')
      }
    }
    ;(options.plugins as Record<string, unknown>).datalabels = { display: false }
    ;(options as Record<string, unknown>).rotation = chart.value!.rotation || 0
    options.scales!.x!.display = false
    options.scales!.y!.display = false
    ;(options.plugins as Record<string, unknown>).outlabels = {
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
      borderColor: function (context: { dataset: { backgroundColor: string[] }; dataIndex: number }) {
        return chroma(context.dataset.backgroundColor[context.dataIndex]).darken().hex()
      },
      backgroundColor: function (context: { dataset: { backgroundColor: string[] }; dataIndex: number }) {
        return context.dataset.backgroundColor[context.dataIndex]
      },
      color: function (context: { dataset: { backgroundColor: string[] }; dataIndex: number }) {
        return chroma(context.dataset.backgroundColor[context.dataIndex]).luminance() < 0.4 ? 'white' : 'black'
      },
      text: function (context: { dataset: { data: number[]; labels: string[]; percentages: number[] }; dataIndex: number }) {
        const index = context.dataIndex
        const value = context.dataset.data[index]

        const lines = [context.dataset.labels[index]]
        if (['values', 'both'].includes(chart.value!.display as string)) {
          lines.push(value.toLocaleString('fr') + (config.value.unit ? ' ' + config.value.unit : ''))
        }
        if (['percentages', 'both'].includes(chart.value!.display as string)) {
          lines.push(context.dataset.percentages[index].toLocaleString('fr') + ' %')
        }
        return lines.join('\n')
      }
    }
    options.plugins!.tooltip!.callbacks = {
      label: (context: TooltipItem<'pie'>) => context.parsed.toLocaleString('fr') + (config.value.unit ? ' ' + config.value.unit : '')
    }
  }

  if (chart.value!.tension != null) {
    options.elements = {
      line: {
        tension: chart.value!.tension / 10
      }
    }
  }

  if (chart.value!.horizontal) {
    ;(options as Record<string, unknown>).indexAxis = 'y'
  }

  if (chart.value!.type === 'paired-histogram') {
    ;(options as Record<string, unknown>).indexAxis = 'y'
    options.scales!.x = {
      ticks: {
        callback: (v: number) => (v < 0 ? -v : v).toLocaleString('fr') + (config.value.unit ? ' ' + config.value.unit : '')
      }
    }
    options.plugins!.tooltip = {
      callbacks: {
        label: (c: TooltipItem<'bar'>) => {
          const value = Number(c.raw)
          const positiveOnly = value < 0 ? -value : value
          return `${c.dataset.label}: ${positiveOnly.toLocaleString('fr')}` + (config.value.unit ? ' ' + config.value.unit : '')
        }
      }
    }
  }
  if (chart.value!.type === 'radar') {
    if (config.value.unit) {
      options.scales = {
        r: {
          ticks: {
            callback: (v: number) => v + ' ' + config.value.unit
          }
        }
      }
    } else delete options.scales
  }
  return options
})

const data = ref<any>(null)

watch(queryKey, async (_newKey, _oldKey, onCleanup) => {
  let cancelled = false
  if (onCleanup) onCleanup(() => { cancelled = true })

  const mode = chart.value!.config.type?.replace('Categories', '')
  if (!mode) {
    if (!cancelled) {
      data.value = null
      loading.value = false
    }
    return
  }
  const fetcher = (getData(theme) as any)[mode]
  if (!fetcher) {
    if (!cancelled) {
      data.value = null
      loading.value = false
    }
    return
  }

  loading.value = true
  try {
    const result = await fetcher()
    if (!cancelled) {
      data.value = result
    }
  } catch (_e) {
    if (!cancelled) {
      data.value = null
    }
  } finally {
    if (!cancelled) {
      loading.value = false
    }
  }
}, { immediate: true })
</script>

<template lang="html">
  <div style="display:flex;flex-direction:column;">
    <Actions
      v-if="dynamicMetric || (chart!.config.dynamicSort && chart!.type !== 'pie') || ['multi-bar', 'multi-line'].includes(chart!.type as string)"
    />
    <div
      v-if="data"
      style="flex:1"
    >
      <Line
        v-if="['line', 'multi-line'].includes(chart!.type as string)"
        :key="chartKey"
        :options="options"
        :data="data"
      />
      <Bar
        v-else-if="['bar', 'multi-bar', 'paired-histogram'].includes(chart!.type as string)"
        :key="chartKey"
        :options="options"
        :data="data"
      />
      <div
        v-else
        :key="chartKey"
        class="h-screen"
        style="display: flex;align-items: center;justify-content: center;"
      >
        <Pie
          v-if="chart!.type === 'pie'"
          :options="options"
          :data="data"
        />
        <Radar
          v-else-if="chart!.type === 'radar'"
          :options="options"
          :data="data"
        />
      </div>
    </div>
    <v-progress-linear
      v-else-if="loading"
      indeterminate
    />
  </div>
</template>
