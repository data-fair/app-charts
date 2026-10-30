<script setup lang="ts">
import { computed } from 'vue'
import { Line, Bar, Pie, Radar } from 'vue-chartjs'
import {
  Chart as ChartJS, Title, Tooltip, Legend,
  BarElement, PointElement, ArcElement, LineElement,
  CategoryScale, LinearScale, RadialLinearScale, TimeScale, Filler
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import OutLabels from '@energiency/chartjs-plugin-piechart-outlabels'
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm'

import Actions from './Actions.vue'
import { useConfig } from '@/composables/config'
import { useChartData } from '@/composables/useChartData'
import { useChartOptions } from '@/composables/useChartOptions'

ChartJS.register(Title, Tooltip, Legend,
  BarElement, PointElement, ArcElement, LineElement,
  CategoryScale, LinearScale, RadialLinearScale, TimeScale, Filler,
  ChartDataLabels, OutLabels)

const { config, chart, dynamicMetric } = useConfig()
const { data, selection } = useChartData()
const { options } = useChartOptions()

// sélection inter-app : le clic émet la clé de son champ d'abscisse dans l'URL
const chartOptions = computed(() => ({ ...options.value, onClick: selection.onClick }))

// Force chart recreation only for structural changes that Chart.js can't handle in-place:
// - horizontal: switches indexAxis (Chart.js can't swap axes live)
// - axes: datasets switching their type/axis keep a stale controller,
//   and adding a secondary scale may not be picked up on update
const chartKey = computed(() => JSON.stringify({
  horizontal: chart.value!.horizontal,
  axes: chart.value!.axes
}))

const showActions = computed(() =>
  !!dynamicMetric.value ||
  (!!chart.value?.config?.dynamicSort && chart.value?.type !== 'pie') ||
  (['multi-bar', 'multi-line'].includes(chart.value?.type as string) && !chart.value?.disableDynamicStack)
)

const chartType = computed(() => chart.value?.type as string | undefined)

const chartTypeLabels: Record<string, string> = {
  line: 'Courbe',
  bar: 'Histogramme',
  'multi-line': 'Plusieurs courbes',
  'multi-bar': 'Histogramme multivalué',
  combo: 'Graphique mixte',
  radar: 'Radar',
  pie: 'Camembert',
  'paired-histogram': 'Paire d\'histogrammes'
}

// alternative textuelle du canvas (RGAA 1.1) : titre de la configuration, sinon
// le libellé du type de graphique
const ariaLabel = computed(() => config.value?.title || chartTypeLabels[chartType.value || ''] || 'Graphique')
</script>

<template lang="html">
  <div style="display:flex;flex-direction:column;">
    <Actions v-if="showActions" />
    <div
      v-if="data"
      style="flex:1"
      role="img"
      :aria-label="ariaLabel"
    >
      <Line
        v-if="['line', 'multi-line'].includes(chartType as string)"
        :key="chartKey"
        :options="chartOptions"
        :data="data"
      />
      <Bar
        v-else-if="['bar', 'multi-bar', 'paired-histogram', 'combo'].includes(chartType as string)"
        :key="chartKey"
        :options="chartOptions"
        :data="data"
      />
      <div
        v-else
        :key="chartKey"
        class="h-screen"
        style="display: flex;align-items: center;justify-content: center;"
      >
        <Pie
          v-if="chartType === 'pie'"
          :options="chartOptions"
          :data="data"
        />
        <Radar
          v-else-if="chartType === 'radar'"
          :options="chartOptions"
          :data="data"
        />
      </div>
    </div>
  </div>
</template>
