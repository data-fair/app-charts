export default function useAppInfo () {
  // @ts-ignore
  const application = /** @type {import('@data-fair/lib-common-types/application/index.js').Application} */ (window.APPLICATION)
  const config = /** @type {import('../config/.type/types.js').Config} */ (application.configuration)
  if (!config) throw new Error('Il n\'y a pas de configuration définie')
  const dataset = config.datasets?.[0]
  if (!dataset) throw new Error('Veuillez sélectionner une source de données')
  const chart = config.chart
  const dynamicMetric = chart.config.valueCalc && chart.config.valueCalc.dynamicMetric
  const fields = dataset.schema?.reduce((a, b) => { a[b.key] = b; return a }, {})

  return {
    application,
    config,
    dataset,
    datasetUrl: dataset.href,
    dynamicMetric,
    chart,
    fields,
    finalizedAt: dataset.finalizedAt
  }
}
