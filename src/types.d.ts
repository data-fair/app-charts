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
    // posé par _public.js, lu par la session à la place du fetch déprécié
    __PUBLIC_SITE_INFO?: FullSiteInfo
    // installé par le service de capture de DataFair (puppeteer), avant le chargement
    // de la page — sa présence signale un contexte de capture
    triggerCapture?: (animationSupported?: boolean) => Promise<boolean>
  }
}
