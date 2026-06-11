// Dataset definitions used by all e2e tests.
// Each dataset exposes id, title, finalizedAt and a minimal `schema` containing
// the fields referenced by the corresponding configs in ./configs.ts.
// The schemas are extracted once from the historical dev-configs to keep them
// in sync with the dataset field names that the configs use.
import schemasJson from './_schemas.json' with { type: 'json' }

const schemas = schemasJson as unknown as Record<string, { id: string; title: string; finalizedAt: string; schema: any[] }>

export type DatasetKey = keyof typeof schemas

export interface TestDataset {
  key: DatasetKey
  id: string
  title: string
  finalizedAt: string
  schema: any[]
}

export const datasets: Record<DatasetKey, TestDataset> = Object.fromEntries(
  (Object.keys(schemas) as DatasetKey[]).map((key) => {
    const ds = schemas[key]
    return [key, { key, id: ds.id, title: ds.title, finalizedAt: ds.finalizedAt, schema: ds.schema }]
  })
) as Record<DatasetKey, TestDataset>

// Returns a dataset descriptor shaped like window.APPLICATION.configuration.datasets[0].
// The href is path-only so the app's useFetch composable issues calls to the same
// origin as the Vite-served page (path-only URLs resolve to the current origin).
// The Playwright route mock in helpers/mock-api.ts intercepts these calls.
export function makeDatasetEntry (key: DatasetKey) {
  const ds = datasets[key]
  return {
    href: `/api/v1/datasets/${ds.id}`,
    id: ds.id,
    title: ds.title,
    finalizedAt: ds.finalizedAt,
    schema: ds.schema
  }
}
