import { inject, computed, ref, type App, type Ref } from 'vue'
import type { Dataset, Field } from '@data-fair/lib-common-types/application/index.js'
import type { AnyChart, AnyChartConfig, AnyConfig } from '@/types'

export interface ConfigState {
  config: Ref<AnyConfig>
  setConfig: (newConfig: AnyConfig) => void
  notifyConfigChange: (field: string, value: unknown) => void
  dataset: Ref<Dataset | undefined>
  chart: Ref<AnyChart & { config: AnyChartConfig }>
  fields: Ref<Record<string, Field>>
  datasetUrl: Ref<string | undefined>
  dynamicMetric: Ref<boolean | undefined>
  finalizedAt: Ref<string | undefined>
  error: Ref<string | null>
}

export function createConfig () {
  const config = ref<AnyConfig>((window.APPLICATION?.configuration || {}) as AnyConfig)

  const dataset = computed(() => config.value?.datasets?.[0] as Dataset | undefined)
  const chart = computed(() => (config.value?.chart || {}) as AnyChart & { config: AnyChartConfig })
  const dynamicMetric = computed(() => chart.value?.config?.valueCalc?.dynamicMetric || chart.value?.config?.dynamicMetric)
  const fields = computed(() => dataset.value?.schema?.reduce((a: Record<string, Field>, b: Field) => { a[b.key] = b; return a }, {}) ?? {})
  const datasetUrl = computed(() => dataset.value?.href)
  const finalizedAt = computed(() => dataset.value?.finalizedAt)

  const error = computed(() => {
    if (!config.value) return 'Il n\'y a pas de configuration définie'
    if (!dataset.value) return 'Veuillez sélectionner une source de données'
    return null
  })

  function setConfig (newConfig: AnyConfig) {
    config.value = newConfig
  }

  function notifyConfigChange (field: string, value: unknown) {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'set-config',
        content: { field, value }
      }, '*')
    }
  }

  function setByPath (obj: Record<string, unknown>, path: string, value: unknown) {
    const keys = path.split('.')
    let current: any = obj
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {}
      } else {
        current[key] = Array.isArray(current[key]) ? [...current[key]] : { ...current[key] }
      }
      current = current[key]
    }
    current[keys[keys.length - 1]] = value
  }

  return {
    install (app: App) {
      app.provide('data-fair-app-config', {
        config,
        setConfig,
        notifyConfigChange,
        dataset,
        chart,
        fields,
        datasetUrl,
        dynamicMetric,
        finalizedAt,
        error
      })

      window.addEventListener('message', (event) => {
        if (event.data?.type === 'set-config' && event.data?.content) {
          const { content } = event.data
          if (content.configuration) {
            // Full configuration update from DataFair
            config.value = content.configuration
          } else if (content.chart || content.datasets || content.layers || content.metrics) {
            // DataFair sometimes sends the full config directly in content
            config.value = content
          } else if (content.field && 'value' in content) {
            // Path-based update (e.g. 'chart.colors.0')
            const newConfig = JSON.parse(JSON.stringify(config.value))
            setByPath(newConfig, content.field, content.value)
            config.value = newConfig
          }
        }
      })
    }
  }
}

export function useConfig (): ConfigState {
  const config = inject<ConfigState>('data-fair-app-config')
  if (!config) throw new Error('useConfig requires using the plugin createConfig')
  return config
}
