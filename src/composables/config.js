import { inject, computed, ref } from 'vue'

export function createConfig () {
  // @ts-ignore
  const application = /** @type {import('@data-fair/lib-common-types/application/index.js').Application} */ (window.APPLICATION)
  const config = ref(application?.configuration)

  const dataset = computed(() => config.value?.datasets?.[0])
  const chart = computed(() => config.value?.chart)
  const dynamicMetric = computed(() => chart.value?.config?.valueCalc?.dynamicMetric || chart.value?.config?.dynamicMetric)
  const fields = computed(() => dataset.value?.schema?.reduce((a, b) => { a[b.key] = b; return a }, {}) ?? {})
  const datasetUrl = computed(() => dataset.value?.href)
  const finalizedAt = computed(() => dataset.value?.finalizedAt)

  const error = computed(() => {
    if (!config.value) return 'Il n\'y a pas de configuration définie'
    if (!dataset.value) return 'Veuillez sélectionner une source de données'
    return null
  })

  function setConfig (newConfig) {
    config.value = newConfig
  }

  function setByPath (obj, path, value) {
    const keys = path.split('.')
    let current = obj
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
    install (app) {
      app.provide('data-fair-app-config', {
        application,
        config,
        setConfig,
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
            config.value = content.configuration
          } else if (content.chart || content.datasets) {
            // DataFair envoie parfois la config complète directement dans content
            config.value = content
          } else if (content.field && 'value' in content) {
            const newConfig = JSON.parse(JSON.stringify(config.value))
            setByPath(newConfig, content.field, content.value)
            config.value = newConfig
          }
        }
      })
    }
  }
}

export function useConfig () {
  const config = inject('data-fair-app-config')
  if (!config) throw new Error('useConfig requires using the plugin createConfig')
  return config
}

export default useConfig
