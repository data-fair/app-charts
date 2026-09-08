// Unit tests — pure helpers from src/assets/utils.ts
import dayjs from 'dayjs'
import 'dayjs/locale/fr.js'
import { test, expect } from '@playwright/test'
import {
  formatDateLabel,
  fillMissingDateAggs,
  getColors,
  getOrderedLabels,
  normalizeDivider,
  extractDividerValue,
  hasUsableDivider,
  normalizeFilters,
  splitString
} from '../../src/assets/utils'

// formatDateLabel formate via dayjs global : aligner la locale sur le comportement
// de l'app (createLocaleDayjs(session.lang) en fr)
dayjs.locale('fr')

test('splitString chunks long labels without breaking words', () => {
  expect(splitString(20, 'Court')).toEqual(['Court'])
  expect(splitString(10, 'un deux trois quatre')).toEqual(['un deux', 'trois', 'quatre'])
  expect(splitString(10, undefined as any)).toEqual([])
})

test('normalizeFilters maps string fields to { key } objects', () => {
  const filters = [
    { type: 'in', field: 'region', values: ['A'] },
    { type: 'interval', field: { key: 'surface' }, minValue: '1', maxValue: '2' }
  ] as any[]
  const normalized = normalizeFilters(filters as any) as any[]
  expect(normalized[0].field).toEqual({ key: 'region' })
  expect(normalized[1].field).toEqual({ key: 'surface' })
})

test('getOrderedLabels reorders with palette seriesOrder and appends missing labels', () => {
  const labels = ['a', 'b', 'c']
  expect(getOrderedLabels(labels, { type: 'palette', seriesOrder: ['c', 'a'] } as any))
    .toEqual(['c', 'a', 'b'])
  expect(getOrderedLabels(labels, { type: 'manual', entries: [{ key: 'b' }] } as any))
    .toEqual(['b', 'a', 'c'])
  expect(getOrderedLabels(labels, undefined)).toEqual(labels)
})

test('getColors assigns deterministic palette colors and manual entries', () => {
  const colors = getColors(['a', 'b'], { type: 'palette', name: 'Accent', offset: 0 } as any)
  expect(colors.a).toMatch(/^#[0-9a-f]{6}$/i)
  expect(colors.b).toMatch(/^#[0-9a-f]{6}$/i)
  expect(colors.a).not.toEqual(colors.b)
  // offset shifts the palette
  const shifted = getColors(['a'], { type: 'palette', name: 'Accent', offset: 1 } as any)
  expect(shifted.a).toEqual(colors.b)

  const manual = getColors(['x'], { type: 'manual', entries: [{ key: 'x', color: '#123456' }] } as any)
  expect(manual.x).toEqual('#123456')
  expect(getColors(['y'], undefined as any)).toEqual({ y: undefined })
})

test('formatDateLabel formats by interval and returns invalid values unchanged', () => {
  expect(formatDateLabel('2024-03-15', 'year')).toEqual('2024')
  expect(formatDateLabel('2024-03-15', 'month')).toEqual('mars 2024')
  expect(formatDateLabel('2024-03-15', 'day')).toEqual('15/03/2024')
  expect(formatDateLabel('2024-03-15', 'week')).toEqual('15/03/2024')
  expect(formatDateLabel('2024-03-15', 'quarter')).toEqual('T1 2024')
  expect(formatDateLabel('not-a-date', 'month')).toEqual('not-a-date')
})

test('fillMissingDateAggs fills gaps and reverses on desc order', () => {
  const aggs = [
    { value: '2024-01-01', total: 1 },
    { value: '2024-01-03', total: 3 }
  ]
  const filled = fillMissingDateAggs(aggs, 'day')
  expect(filled.map((a: any) => a.value)).toEqual(['2024-01-01', '2024-01-02', '2024-01-03'])
  expect((filled[1] as any).total).toBeUndefined()

  const desc = fillMissingDateAggs(aggs, 'day', 'desc')
  expect(desc.map((a: any) => a.value)).toEqual(['2024-01-03', '2024-01-02', '2024-01-01'])
})

test('normalizeDivider accepts column configs and falls back to none', () => {
  expect(normalizeDivider(undefined)).toEqual({ type: 'none' })
  expect(normalizeDivider(null)).toEqual({ type: 'none' })
  expect(normalizeDivider(12)).toEqual({ type: 'none' }) // ancien format nombre global : géré par le multiplicateur
  expect(normalizeDivider({ type: 'none' })).toEqual({ type: 'none' })
  expect(normalizeDivider({ type: 'column', field: 'pop' })).toEqual({ type: 'column', field: 'pop', metric: 'sum' })
  expect(normalizeDivider({ type: 'column', field: 'pop', metric: 'avg' })).toEqual({ type: 'column', field: 'pop', metric: 'avg' })
  expect(normalizeDivider({ type: 'column' })).toEqual({ type: 'none' }) // incomplet
  expect(normalizeDivider({ type: 'column', field: '', metric: 'sum' })).toEqual({ type: 'none' })
})

test('extractDividerValue reads rows, agg items and pre-aggregated numbers', () => {
  const divider = { type: 'column', field: 'pop', metric: 'sum' } as const
  expect(extractDividerValue({ pop: 42 }, divider)).toBe(42) // ligne : valeur brute de la colonne
  expect(extractDividerValue({ pop_sum: 42 }, divider)).toBe(42) // item d'agrégat : métrique additionnelle
  expect(extractDividerValue({ pop_sum: '42' }, divider)).toBe(42)
  expect(extractDividerValue({ pop_sum: Number.NaN }, divider)).toBeUndefined()
  expect(extractDividerValue({}, divider)).toBeUndefined()
  expect(extractDividerValue(undefined, divider)).toBeUndefined()
  expect(extractDividerValue(120, divider)).toBe(120) // agrégat global déjà extrait
  expect(extractDividerValue(Number.NaN, divider)).toBeUndefined()
  expect(extractDividerValue({ pop_sum: 42 }, { type: 'none' })).toBeUndefined()
})

test('hasUsableDivider only gates column dividers', () => {
  const divider = { type: 'column', field: 'pop', metric: 'sum' } as const
  expect(hasUsableDivider({ pop_sum: 0 }, divider)).toBe(false)
  expect(hasUsableDivider({}, divider)).toBe(false)
  expect(hasUsableDivider({ pop_sum: 3 }, divider)).toBe(true)
  expect(hasUsableDivider({}, { type: 'none' })).toBe(true)
})
