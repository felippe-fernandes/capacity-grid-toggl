import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDebouncedValue } from './useDebouncedValue'

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('only takes the last value once typing stops', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'd' },
    })
    rerender({ value: 'de' })
    rerender({ value: 'dee' })
    expect(result.current).toBe('d')

    act(() => vi.advanceTimersByTime(299))
    expect(result.current).toBe('d')

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe('dee')
  })
})
