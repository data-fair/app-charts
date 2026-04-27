declare module 'chroma-js' {
  const chroma: any
  export default chroma
}

declare module '@energiency/chartjs-plugin-piechart-outlabels' {
  const OutLabels: any
  export default OutLabels
}

declare module 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm' {
  // side-effect only
}

declare module 'natural-orderby' {
  export function orderBy<T> (collection: T[], iteratees?: any | any[], orders?: string | string[]): T[]
}

declare module '@data-fair/lib-vue/reactive-search-params-global.js' {
  const reactiveSearchParams: Record<string, any>
  export default reactiveSearchParams
}

declare module '@data-fair/lib-vue/concept-filters.js' {
  export function useConceptFilters (reactiveSearchParams: Record<string, any>, datasetId?: string): any
}

declare module '@data-fair/lib-vue/session.js' {
  export function createSession (opts: { directoryUrl: string, siteInfo?: boolean }): Promise<any>
}

declare module '@data-fair/lib-vuetify' {
  export function vuetifySessionOptions (session: any): any
}

declare module '@data-fair/lib-utils/filters' {
  export function filters2qs (filters: any[]): string
}

declare module '@data-fair/lib-common-types/application/index.js' {
  export interface Application {
    configuration?: any
    href?: string
  }
}

interface Window {
  APPLICATION: import('@data-fair/lib-common-types/application/index.js').Application
  vIframeOptions?: any
}
