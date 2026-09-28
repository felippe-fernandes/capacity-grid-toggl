import { describe, expect, it } from 'vitest'
import { parseWeeklyHours } from './weeklyHours'

describe('parseWeeklyHours', () => {
  it('accepts whole hours from 0 to 80', () => {
    expect(parseWeeklyHours('0')).toEqual({ ok: true, hours: 0 })
    expect(parseWeeklyHours(' 32 ')).toEqual({ ok: true, hours: 32 })
    expect(parseWeeklyHours('80')).toEqual({ ok: true, hours: 80 })
  })

  it('refuses empty, fractional and out of range values', () => {
    expect(parseWeeklyHours('')).toMatchObject({ ok: false, message: 'Enter a number of hours.' })
    expect(parseWeeklyHours('abc')).toMatchObject({ ok: false, message: 'Enter a number of hours.' })
    for (const draft of ['12.5', '-1', '81']) {
      expect(parseWeeklyHours(draft)).toMatchObject({
        ok: false,
        message: 'Weekly hours must be a whole number from 0 to 80.',
      })
    }
  })
})
