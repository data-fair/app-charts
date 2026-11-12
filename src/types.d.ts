/// <reference types="vite/client" />

import type { _Jl } from './config/.type/index.js'
import type { Application } from '@data-fair/lib-common-types/application/index.js'
import type { FullSiteInfo } from '@data-fair/lib-vue/session.js'

export type AnyChart = NonNullable<_Jl['chart']> & Record<string, any>
export type AnyChartConfig = NonNullable<_Jl['chart']>['config'] & Record<string, any>
export type AnyConfig = _Jl

declare global {
  interface Window {
    APPLICATION: Application & { href: string }
    vIframeOptions?: { reactiveParams: Record<string, string> }
    // set by _public.js, read by the session instead of the deprecated fetch
    __PUBLIC_SITE_INFO?: FullSiteInfo
    // installed by the DataFair capture service (puppeteer), before the page
    // loads — its presence signals a capture context
    triggerCapture?: (animationSupported?: boolean) => Promise<boolean>
  }
}
