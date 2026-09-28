import { z } from 'zod'
import { addDays, daysBetween, mondayOf } from './dates'

const MAX_DAYS = 26 * 7

const rangeSchema = z.object({
  from: z.iso.date(),
  to: z.iso.date(),
})

export type Range = z.infer<typeof rangeSchema>

export function defaultRange(today: string): Range {
  const from = mondayOf(today)
  return { from, to: addDays(from, 20) }
}

function sundayOf(iso: string): string {
  return addDays(mondayOf(iso), 6)
}

export function normalizeRange({ from, to }: Range): Range {
  const start = mondayOf(from)
  const end = sundayOf(to < from ? from : to)
  if (daysBetween(start, end) >= MAX_DAYS) return { from: start, to: addDays(start, MAX_DAYS - 1) }
  return { from: start, to: end }
}

export function withFrom(range: Range, value: string): Range {
  const from = mondayOf(value)
  let to = range.to < from ? sundayOf(from) : range.to
  if (daysBetween(from, to) >= MAX_DAYS) to = addDays(from, MAX_DAYS - 1)
  return { from, to }
}

export function withTo(range: Range, value: string): Range {
  const to = sundayOf(value)
  let from = range.from > to ? mondayOf(to) : range.from
  if (daysBetween(from, to) >= MAX_DAYS) from = addDays(to, -(MAX_DAYS - 1))
  return { from, to }
}

export function shiftRange(range: Range, weeks: number): Range {
  return { from: addDays(range.from, weeks * 7), to: addDays(range.to, weeks * 7) }
}

export function rangeStartingAt(range: Range, day: string): Range {
  const from = mondayOf(day)
  return { from, to: addDays(from, daysBetween(range.from, range.to)) }
}

export function parseRange(params: URLSearchParams): Range | null {
  const parsed = rangeSchema.safeParse({ from: params.get('from'), to: params.get('to') })
  return parsed.success ? normalizeRange(parsed.data) : null
}

export function serializeRange(range: Range): Record<string, string> {
  return { from: range.from, to: range.to }
}
