import { describe, expect, it } from 'vitest'
import { formatWeek } from './dates'

describe('formatWeek', () => {
  it('shows the day and short month without shifting the date', () => {
    expect(formatWeek('2025-12-29')).toBe('Dec 29')
    expect(formatWeek('2026-01-05')).toBe('Jan 5')
  })
})
