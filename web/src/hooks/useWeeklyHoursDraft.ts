import { useState } from 'react'
import { parseWeeklyHours } from '../lib/weeklyHours'

export function useWeeklyHoursDraft(current: number) {
  const [draft, setDraft] = useState(String(current))
  const parsed = parseWeeklyHours(draft)
  return {
    draft,
    setDraft,
    hours: parsed.ok ? parsed.hours : null,
    error: parsed.ok ? null : parsed.message,
    unchanged: parsed.ok && parsed.hours === current,
  }
}
