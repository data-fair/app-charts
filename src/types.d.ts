/// <reference types="vite/client" />

import type { _JlResolved } from './config/.type/index.js'
import type { Application } from '@data-fair/lib-common-types/application/index.js'

export type AnyChart = NonNullable<_JlResolved['chart']> & Record<string, any>
export type AnyChartConfig = NonNullable<_JlResolved['chart']>['config'] & Record<string, any>
export type AnyConfig = _JlResolved

declare global {
  interface Window {
    APPLICATION: Application & { href: string }
    vIframeOptions?: { reactiveParams: Record<string, string> }
  }
}
