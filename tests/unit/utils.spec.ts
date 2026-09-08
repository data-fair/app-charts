// Unit tests — pure helpers from src/assets/utils.ts
import dayjs from 'dayjs'
import 'dayjs/locale/fr.js'
import { test, expect } from '@playwright/test'
import {
  formatDateLabel,
  fillMissingDateAggs,
  getColors,
  getOrderedLabels,
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
