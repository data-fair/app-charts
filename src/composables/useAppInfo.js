export default function useAppInfo () {
  // @ts-ignore
  const application = /** @type {import('@data-fair/lib/shared/application.js').Application} */ (window.APPLICATION)
  const config = /** @type {import('../config/.type/types.js').Config} */ (application.configuration)
  if (!config) throw new Error('Il n\'y a pas de configuration définie')
  const dataset = config.datasets?.[0]
  if (!dataset) throw new Error('Veuillez sélectionner une source de données')
  const chart = config.chart
  const dynamicMetric = chart.config.valueCalc && chart.config.valueCalc.dynamicMetric

  return {
    application,
    config,
    dataset,
    datasetUrl: dataset.href,
    dynamicMetric,
    chart,
    finalizedAt: dataset.finalizedAt
  }
}
