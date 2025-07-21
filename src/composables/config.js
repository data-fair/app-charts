import { inject, computed, ref } from 'vue'

export function createConfig () {
  // @ts-ignore
  const application = /** @type {import('@data-fair/lib-common-types/application/index.js').Application} */ (window.APPLICATION)
  const config = ref(application?.configuration)

  const dataset = computed(() => config.value?.datasets?.[0])
  const chart = computed(() => config.value?.chart)
  const dynamicMetric = computed(() => chart.value?.config?.valueCalc && chart.value?.config?.valueCalc?.dynamicMetric)
  const fields = computed(() => dataset.value?.schema?.reduce((a, b) => { a[b.key] = b; return a }, {}) ?? {})
  const datasetUrl = computed(() => dataset.value?.href)
  const finalizedAt = computed(() => dataset.value?.finalizedAt)

  const error = computed(() => {
    if (!config.value) return 'Il n\'y a pas de configuration définie'
    if (!dataset.value) return 'Veuillez sélectionner une source de données'
    return null
  })

  return {
    install (app) {
      app.provide('data-fair-app-config', {
        application,
        config,
        dataset,
        chart,
        fields,
        datasetUrl,
        dynamicMetric,
        finalizedAt,
        error
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
