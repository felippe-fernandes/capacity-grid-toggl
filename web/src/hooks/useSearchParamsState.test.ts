import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useSearchParamsState } from './useSearchParamsState'

type Filter = { q: string }

const parse = (params: URLSearchParams): Filter | null => {
  const q = params.get('q')
  return q ? { q } : null
}
const serialize = (value: Filter) => ({ q: value.q })
const fallback: Filter = { q: 'default' }

function setUrl(search: string) {
  window.history.replaceState(null, '', `/${search}`)
}

function renderFilterHook() {
  return renderHook(() => useSearchParamsState(parse, serialize, fallback))
}

describe('useSearchParamsState', () => {
  beforeEach(() => setUrl(''))
  afterEach(cleanup)

  it('reads the initial value from the url', () => {
    setUrl('?q=hello')
    const { result } = renderFilterHook()
    expect(result.current[0]).toEqual({ q: 'hello' })
  })

  it('falls back and writes the fallback to the url when the url has nothing valid', () => {
    const { result } = renderFilterHook()
    expect(result.current[0]).toEqual(fallback)
    expect(window.location.search).toBe('?q=default')
  })

  it('writes new values to the url', () => {
    const { result } = renderFilterHook()
    act(() => result.current[1]({ q: 'next' }))
    expect(result.current[0]).toEqual({ q: 'next' })
    expect(window.location.search).toBe('?q=next')
  })

  it('accepts an updater function like useState', () => {
    setUrl('?q=a')
    const { result } = renderFilterHook()
    act(() => result.current[1]((prev) => ({ q: prev.q + 'b' })))
    expect(window.location.search).toBe('?q=ab')
  })

  it('keeps params it does not own', () => {
    setUrl('?q=hello&tab=people')
    const { result } = renderFilterHook()
    act(() => result.current[1]({ q: 'next' }))
    expect(new URLSearchParams(window.location.search).get('tab')).toBe('people')
  })

  it('replaces the history entry instead of adding new ones', () => {
    const { result } = renderFilterHook()
    const length = window.history.length
    act(() => result.current[1]({ q: 'a' }))
    act(() => result.current[1]({ q: 'b' }))
    expect(window.history.length).toBe(length)
  })
})
