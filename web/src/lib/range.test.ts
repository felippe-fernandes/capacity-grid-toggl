import { describe, expect, it } from 'vitest'
import { defaultRange, normalizeRange, parseRange, shiftRange, withFrom, withTo } from './range'

const params = (search: string) => new URLSearchParams(search)

describe('parseRange', () => {
  it('reads a valid range and snaps it to whole weeks', () => {
    expect(parseRange(params('?from=2026-01-07&to=2026-01-14'))).toEqual({ from: '2026-01-05', to: '2026-01-18' })
  })

  it('returns null for missing or malformed dates', () => {
    expect(parseRange(params(''))).toBeNull()
    expect(parseRange(params('?from=banana&to=2026-01-14'))).toBeNull()
    expect(parseRange(params('?from=2026-01-05'))).toBeNull()
  })
})

describe('normalizeRange', () => {
  it('falls back to the from week when to is before from', () => {
    expect(normalizeRange({ from: '2026-01-07', to: '2026-01-02' })).toEqual({ from: '2026-01-05', to: '2026-01-11' })
  })

  it('caps the range at 26 weeks', () => {
    expect(normalizeRange({ from: '2026-01-05', to: '2030-01-01' })).toEqual({ from: '2026-01-05', to: '2026-07-05' })
  })
})

describe('withFrom', () => {
  it('pushes to forward when from moves past it', () => {
    expect(withFrom({ from: '2026-01-05', to: '2026-01-18' }, '2026-02-04')).toEqual({
      from: '2026-02-02',
      to: '2026-02-08',
    })
  })

  it('pulls to back to stay within 26 weeks', () => {
    expect(withFrom({ from: '2026-01-05', to: '2026-07-05' }, '2025-12-01')).toEqual({
      from: '2025-12-01',
      to: '2026-05-31',
    })
  })
})

describe('withTo', () => {
  it('pulls from back when to moves before it', () => {
    expect(withTo({ from: '2026-01-05', to: '2026-01-18' }, '2025-12-24')).toEqual({
      from: '2025-12-22',
      to: '2025-12-28',
    })
  })

  it('pushes from forward to stay within 26 weeks', () => {
    expect(withTo({ from: '2026-01-05', to: '2026-01-18' }, '2027-01-01')).toEqual({
      from: '2026-07-06',
      to: '2027-01-03',
    })
  })
})

describe('shiftRange', () => {
  it('moves both ends by whole weeks across a year boundary', () => {
    expect(shiftRange({ from: '2025-12-29', to: '2026-01-18' }, -1)).toEqual({ from: '2025-12-22', to: '2026-01-11' })
  })
})

describe('defaultRange', () => {
  it('starts on the current week and shows three weeks', () => {
    expect(defaultRange('2026-09-30')).toEqual({ from: '2026-09-28', to: '2026-10-18' })
  })
})
