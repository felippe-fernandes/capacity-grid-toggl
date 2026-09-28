import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CapacityData } from '../api/capacity'
import { useUpdateWeeklyHours } from './useUpdateWeeklyHours'

const capacity = (weeklyHours: number): CapacityData => ({
  weeks: ['2026-01-05'],
  matched: 1,
  people: [{ id: 4, name: 'Dee Okafor', weeklyHours, allocated: [45] }],
})

const saved = (weeklyHours: number) =>
  new Response(JSON.stringify({ id: 4, name: 'Dee Okafor', weeklyHours }), { status: 200 })

function deferred() {
  let resolve!: (res: Response) => void
  const promise = new Promise<Response>((r) => (resolve = r))
  return { promise, resolve }
}

const fetchMock = vi.fn()

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  queryClient.setQueryData(['capacity', 'this range'], capacity(40))
  queryClient.setQueryData(['capacity', 'another range'], capacity(40))
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => useUpdateWeeklyHours(4), { wrapper })
  const hoursIn = (range: string) => queryClient.getQueryData<CapacityData>(['capacity', range])?.people[0].weeklyHours
  return { result, hoursIn }
}

describe('useUpdateWeeklyHours', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('updates every cached range before the server answers', async () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    const { result, hoursIn } = setup()

    act(() => result.current.mutate(50))

    await waitFor(() => expect(hoursIn('this range')).toBe(50))
    expect(hoursIn('another range')).toBe(50)
  })

  it('puts the old value back and says why when the save fails', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 500 }))
    const { result, hoursIn } = setup()

    act(() => result.current.mutate(50))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe("Couldn't save. Try again.")
    expect(hoursIn('this range')).toBe(40)
    expect(hoursIn('another range')).toBe(40)
  })

  it('explains when the server cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const { result } = setup()

    act(() => result.current.mutate(50))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe("Couldn't reach the server. Check your connection.")
  })

  it('sends saves for the same person one at a time, in order', async () => {
    const first = deferred()
    const second = deferred()
    fetchMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const { result, hoursIn } = setup()

    act(() => result.current.mutate(60))
    act(() => result.current.mutate(70))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).weeklyHours).toBe(60)

    first.resolve(saved(60))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).weeklyHours).toBe(70)

    second.resolve(saved(70))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(hoursIn('this range')).toBe(70)
  })
})
