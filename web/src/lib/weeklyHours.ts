import { z } from 'zod'

export const MIN_WEEKLY_HOURS = 0
export const MAX_WEEKLY_HOURS = 80

const outOfRange = `Weekly hours must be a whole number from ${MIN_WEEKLY_HOURS} to ${MAX_WEEKLY_HOURS}.`

const weeklyHoursSchema = z
  .number({ error: 'Enter a number of hours.' })
  .int(outOfRange)
  .min(MIN_WEEKLY_HOURS, outOfRange)
  .max(MAX_WEEKLY_HOURS, outOfRange)

export type ParsedHours = { ok: true; hours: number } | { ok: false; message: string }

export function parseWeeklyHours(draft: string): ParsedHours {
  const parsed = weeklyHoursSchema.safeParse(draft.trim() === '' ? NaN : Number(draft))
  return parsed.success ? { ok: true, hours: parsed.data } : { ok: false, message: parsed.error.issues[0].message }
}
