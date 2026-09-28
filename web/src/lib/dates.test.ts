import { describe, expect, it } from 'vitest'
import { formatRangeLabel, formatWeek, isCurrentWeek, weekSpanLabel } from './dates'

describe('formatWeek', () => {
  it('shows the day and short month without shifting the date', () => {
    expect(formatWeek('2025-12-29')).toBe('Dec 29')
    expect(formatWeek('2026-01-05')).toBe('Jan 5')
  })
})

describe('formatRangeLabel', () => {
  it('writes the year once when both ends share it', () => {
    expect(formatRangeLabel('2026-01-05', '2026-02-08')).toBe('Jan 5 – Feb 8, 2026')
  })

  it('writes both years when the range crosses one', () => {
    expect(formatRangeLabel('2025-12-29', '2026-02-01')).toBe('Dec 29, 2025 – Feb 1, 2026')
  })
})

describe('weekSpanLabel', () => {
  it('runs from Monday to Sunday', () => {
    expect(weekSpanLabel('2026-01-05')).toBe('Jan 5 – Jan 11, 2026')
  })
})

describe('isCurrentWeek', () => {
  it('matches any day of the same week', () => {
    expect(isCurrentWeek('2026-09-28', '2026-10-04')).toBe(true)
    expect(isCurrentWeek('2026-09-28', '2026-10-05')).toBe(false)
  })
})
