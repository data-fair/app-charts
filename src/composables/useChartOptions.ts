import { computed, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'
import chroma from 'chroma-js'
import reactiveSearchParams from '@data-fair/lib-vue/reactive-search-params-global.js'
import { useSession } from '@data-fair/lib-vue/session.js'
import type { TooltipItem } from 'chart.js'
import { useConfig } from '@/composables/config'

export function useChartOptions (): { options: ComputedRef<any> } {
  const { config, chart } = useConfig()
  const { lang } = useSession()
  // portée globale : les numberFormats (percent) de createI18n — l'app n'a pas de
  // bloc <i18n> local, mais on l'explicite pour figer le contrat
  const { n } = useI18n({ useScope: 'global' })

  const chartFontFamily = computed(() => {
    if (typeof document === 'undefined') return ''
    return getComputedStyle(document.body).fontFamily || getComputedStyle(document.documentElement).fontFamily
  })

  const options = computed(() => {
    const c = chart.value
    if (!c) return {}

    const opts: any = {
      maintainAspectRatio: false,
      responsive: true,
      locale: lang.value,
      font: {
        family: chartFontFamily.value
      },
      plugins: {
        legend: {
          display: c.type !== 'pie' && !!c.config.colorOrder &&
          !(c.config.groupBy?.type === 'value' && c.config.groupBy.field === c.config.groupsField),
          position: config.value.legendPosition || 'top'
        },
        title: {
          display: !!config.value.title,
          text: config.value.title
        },
        tooltip: {
          enabled: !config.value.disableTooltip,
          callbacks: {
            title: (items: TooltipItem<'line' | 'bar' | 'pie' | 'radar'>[]) => items[0].label,
            label: (context: TooltipItem<'line' | 'bar' | 'pie' | 'radar'>) => {
              return (context.dataset.label ? context.dataset.label + ' : ' : '') + n((c.horizontal ? context.parsed.x : context.parsed.y) || (context.parsed as unknown as { r: number }).r) + (config.value.unit ? ' ' + config.value.unit : '')
            }
          }
        }
      }
    }
    if (c.cutout) (opts as Record<string, unknown>).cutout = c.cutout + '%'

    opts.scales = {
      x: { stacked: c.type === 'paired-histogram' || c.config.categoriesField || reactiveSearchParams.stacked === 'true' },
      y: { stacked: c.type === 'paired-histogram' || c.config.categoriesField || reactiveSearchParams.stacked === 'true' }
    }
    if (config.value.xTitle?.length) {
      opts.scales!.x!.title = { text: config.value.xTitle, display: true, font: { weight: 'bold' } }
    }
    if (config.value.yTitle?.length) {
      opts.scales!.y!.title = { text: config.value.yTitle, display: true, font: { weight: 'bold' } }
    }

    if (c.yAxisStartsZero !== undefined) {
      opts.scales!.y!.beginAtZero = c.yAxisStartsZero
    }
    if (c.percentage) {
      if (c.horizontal) {
        opts.scales!.x!.max = 100
        opts.scales!.x!.ticks = { callback: (v: number) => n(v) + ' %' }
      } else {
        opts.scales!.y!.max = 100
        opts.scales!.y!.ticks = { callback: (v: number) => n(v) + ' %' }
      }
    } else if (config.value.unit && c.type !== 'paired-histogram') {
      if (c.horizontal) {
        opts.scales!.x!.ticks = { callback: (v: number) => n(v) + ' ' + config.value.unit }
      } else {
        opts.scales!.y!.ticks = { callback: (v: number) => n(v) + ' ' + config.value.unit }
      }
    }
    if (c.hideYAxis) {
      opts.scales![c.horizontal ? 'y' : 'x']!.grid = { display: false }
      opts.scales![c.horizontal ? 'x' : 'y']!.display = false
      const isStacked = c.type === 'paired-histogram' || c.config.categoriesField || reactiveSearchParams.stacked === 'true'
      ;(opts.plugins as Record<string, unknown>).datalabels = {
        anchor: isStacked ? 'center' : 'end',
        align: isStacked ? 'center' : 'end',
        labels: { title: { font: { weight: 'bold' } } },
        formatter: (value: number) => {
          if (!value) return ''
          if (c.percentage) {
            return n(value / 100, 'percent')
          }
          return n(value) + (config.value.unit ? ' ' + config.value.unit : '')
        }
      }
      opts.layout = { padding: c.horizontal ? { right: 64 } : { top: 24 } }
    } else {
      ;(opts.plugins as Record<string, unknown>).datalabels = { display: false }
    }

    if (c.type === 'pie') {
      if (config.value.title || c.sumInTitle) {
        opts.plugins!.title!.padding = { top: 0, bottom: 48 }
        opts.layout = { padding: { top: 0, left: 48, right: 48, bottom: 48 } }
      } else {
        opts.layout = { padding: 48 }
      }
      if (c.sumInTitle) {
        opts.plugins!.title!.display = true
        ;(opts.plugins!.title as Record<string, unknown>).text = function (context: TooltipItem<'pie'>) {
          const data = context.chart.data.datasets[0].data as number[]
          const sum = data.reduce((acc, v) => acc + v, 0)
          return (config.value.title ? config.value.title + ' : ' : '') + n(sum) + (config.value.unit ? ' ' + config.value.unit : '')
        }
      }
      ;(opts.plugins as Record<string, unknown>).datalabels = { display: false }
      ;(opts as Record<string, unknown>).rotation = c.rotation || 0
      opts.scales!.x!.display = false
      opts.scales!.y!.display = false
      ;(opts.plugins as Record<string, unknown>).outlabels = {
        borderWidth: 1,
        borderRadius: 4,
        font: { weight: 'bold', size: 16, lineHeight: 0.8, resizable: false },
        textAlign: 'center',
        padding: { left: 8, right: 8, top: 0, bottom: 0 },
        borderColor: (ctx: { dataset: { backgroundColor: string[] }; dataIndex: number }) =>
          chroma(ctx.dataset.backgroundColor[ctx.dataIndex]).darken().hex(),
        backgroundColor: (ctx: { dataset: { backgroundColor: string[] }; dataIndex: number }) =>
          ctx.dataset.backgroundColor[ctx.dataIndex],
        color: (ctx: { dataset: { backgroundColor: string[] }; dataIndex: number }) =>
          chroma(ctx.dataset.backgroundColor[ctx.dataIndex]).luminance() < 0.4 ? 'white' : 'black',
        text: (ctx: { dataset: { data: number[]; labels: string[]; percentages: number[] }; dataIndex: number }) => {
          const lines = [ctx.dataset.labels[ctx.dataIndex]]
          if (['values', 'both'].includes(c.display as string)) {
            lines.push(n(ctx.dataset.data[ctx.dataIndex]) + (config.value.unit ? ' ' + config.value.unit : ''))
          }
          if (['percentages', 'both'].includes(c.display as string)) {
            lines.push(n(ctx.dataset.percentages[ctx.dataIndex] / 100, 'percent'))
          }
          return lines.join('\n')
        }
      }
      opts.plugins!.tooltip!.callbacks = {
        label: (context: TooltipItem<'pie'>) => n(context.parsed) + (config.value.unit ? ' ' + config.value.unit : '')
      }
    }

    // motif de trait des courbes (line, multi-line, radar) : Chart.js applique
    // elements.line aux LineElement de tous ces types, légende comprise
    const lineDashPatterns: Record<string, number[]> = {
      dashed: [6, 6],
      dotted: [2, 3]
    }
    const lineElement: Record<string, unknown> = {}
    if (c.tension != null) lineElement.tension = c.tension / 10
    if (c.lineDash && lineDashPatterns[c.lineDash]) lineElement.borderDash = lineDashPatterns[c.lineDash]
    if (Object.keys(lineElement).length) {
      ;(opts as Record<string, unknown>).elements = { line: lineElement }
    }

    if (c.horizontal) {
      ;(opts as Record<string, unknown>).indexAxis = 'y'
    }

    if (c.type === 'paired-histogram') {
      ;(opts as Record<string, unknown>).indexAxis = 'y'
      opts.scales!.x = {
        ticks: {
          callback: (v: number) => n(v < 0 ? -v : v) + (config.value.unit ? ' ' + config.value.unit : '')
        }
      }
      opts.plugins!.tooltip = {
        callbacks: {
          label: (cc: TooltipItem<'bar'>) => {
            const value = Number(cc.raw)
            const positiveOnly = value < 0 ? -value : value
            return `${cc.dataset.label}: ${n(positiveOnly)}` + (config.value.unit ? ' ' + config.value.unit : '')
          }
        }
      }
    }

    if (c.type === 'radar') {
      if (config.value.unit) {
        opts.scales = {
          r: {
            ticks: { callback: (v: number) => v + ' ' + config.value.unit }
          }
        }
      } else delete opts.scales
    }

    // service de capture de DataFair : signaler que le graphique est réellement
    // rendu (fin de l'animation de rendu Chart.js). meta df:capture-delay = repli.
    if (window.triggerCapture) {
      opts.animation = {
        onComplete: () => { window.triggerCapture?.(false) }
      }
    }

    return opts
  })

  return { options }
}
