/// <reference types="vite/client" />

import type { _JlResolved } from './config/.type/index.js'

export type AnyChart = NonNullable<_JlResolved['chart']> & Record<string, any>
export type AnyChartConfig = Record<string, any>
export type AnyConfig = _JlResolved & Record<string, any>
