import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useWeeklyHoursDraft } from './useWeeklyHoursDraft'

describe('useWeeklyHoursDraft', () => {
  afterEach(cleanup)

  it('starts from the current value, valid and unchanged', () => {
    const { result } = renderHook(() => useWeeklyHoursDraft(40))
    expect(result.current).toMatchObject({ draft: '40', hours: 40, error: null, unchanged: true })
  })

  it('reports a valid change', () => {
    const { result } = renderHook(() => useWeeklyHoursDraft(40))
    act(() => result.current.setDraft('32'))
    expect(result.current).toMatchObject({ hours: 32, error: null, unchanged: false })
  })

  it('explains an invalid draft and has no hours to save', () => {
    const { result } = renderHook(() => useWeeklyHoursDraft(40))
    act(() => result.current.setDraft('120'))
    expect(result.current).toMatchObject({
      hours: null,
      error: 'Weekly hours must be a whole number from 0 to 80.',
      unchanged: false,
    })
  })
})
