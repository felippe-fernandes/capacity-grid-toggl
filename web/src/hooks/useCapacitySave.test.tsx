import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PersonCapacity } from '../api/capacity'
import { useCapacitySave } from './useCapacitySave'

const fetchMock = vi.fn()
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const sentBody = (call: number) => JSON.parse(fetchMock.mock.calls[call][1].body)
const ana = (weeklyHours: number): PersonCapacity => ({ id: 1, name: 'Ana Ferreira', weeklyHours, allocated: [40] })

function setup(person: PersonCapacity) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return renderHook(({ person }) => useCapacitySave(person), { wrapper, initialProps: { person } })
}

describe('useCapacitySave', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('shows the hours being saved while the request is in flight', async () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    const { result } = setup(ana(40))

    act(() => result.current.save(32))

    await waitFor(() => expect(result.current.savingHours).toBe(32))
    expect(sentBody(0)).toEqual({ weeklyHours: 32, expectedWeeklyHours: 40 })
  })

  it('describes a failed save with both values, and retries the same change', async () => {
    fetchMock.mockResolvedValueOnce(json({ error: { code: 'internal', message: 'boom' } }, 500))
    const { result } = setup(ana(40))

    act(() => result.current.save(32))

    await waitFor(() =>
      expect(result.current.failure).toEqual({
        kind: 'failed',
        from: 40,
        to: 32,
        message: "Couldn't save. Try again.",
      }),
    )

    fetchMock.mockResolvedValueOnce(json({ id: 1, name: 'Ana Ferreira', weeklyHours: 32 }))
    act(() => result.current.retry())

    await waitFor(() => expect(result.current.failure).toBeNull())
    expect(sentBody(1)).toEqual({ weeklyHours: 32, expectedWeeklyHours: 40 })
  })

  it('describes a conflict, and "use mine" overwrites on top of their value', async () => {
    fetchMock.mockResolvedValueOnce(
      json(
        { error: { code: 'conflict', message: 'changed' }, current: { id: 1, name: 'Ana Ferreira', weeklyHours: 36 } },
        409,
      ),
    )
    const { result, rerender } = setup(ana(40))

    act(() => result.current.save(32))

    await waitFor(() => expect(result.current.failure).toEqual({ kind: 'conflict', theirs: 36, mine: 32 }))

    rerender({ person: ana(36) })
    fetchMock.mockResolvedValueOnce(json({ id: 1, name: 'Ana Ferreira', weeklyHours: 32 }))
    act(() => result.current.retry())

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(sentBody(1)).toEqual({ weeklyHours: 32, expectedWeeklyHours: 36 })
  })

  it('dismiss clears the failure', async () => {
    fetchMock.mockResolvedValueOnce(json({ error: { code: 'internal', message: 'boom' } }, 500))
    const { result } = setup(ana(40))

    act(() => result.current.save(32))
    await waitFor(() => expect(result.current.failure).not.toBeNull())

    act(() => result.current.dismiss())
    await waitFor(() => expect(result.current.failure).toBeNull())
  })
})
