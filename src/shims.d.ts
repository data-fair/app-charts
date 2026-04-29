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
