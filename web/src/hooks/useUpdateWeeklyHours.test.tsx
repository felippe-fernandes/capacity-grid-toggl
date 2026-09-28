import type { ReactNode } from 'react'
import { type InfiniteData, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CapacityPage } from '../api/capacity'
import { describeSaveError } from '../lib/saveErrors'
import { useUpdateWeeklyHours } from './useUpdateWeeklyHours'

type Pages = InfiniteData<CapacityPage, string | undefined>

const cached = (weeklyHours: number): Pages => ({
  pages: [{ weeks: ['2026-01-05'], matched: 1, people: [{ id: 4, name: 'Dee Okafor', weeklyHours, allocated: [45] }] }],
  pageParams: [undefined],
})

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const saved = (weeklyHours: number) => json({ id: 4, name: 'Dee Okafor', weeklyHours })

function deferred() {
  let resolve!: (res: Response) => void
  const promise = new Promise<Response>((r) => (resolve = r))
  return { promise, resolve }
}

const fetchMock = vi.fn()
const sentBody = (call: number) => JSON.parse(fetchMock.mock.calls[call][1].body)

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const keyFor = (range: string) => ['capacity', 'list', range]
  queryClient.setQueryData(keyFor('this range'), cached(40))
  queryClient.setQueryData(keyFor('another range'), cached(40))
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => useUpdateWeeklyHours(4), { wrapper })
  const hoursIn = (range: string) => queryClient.getQueryData<Pages>(keyFor(range))?.pages[0].people[0].weeklyHours
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

  it('updates every cached range before the server answers and sends the expected value', async () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    const { result, hoursIn } = setup()

    act(() => result.current.mutate({ hours: 50, expected: 40 }))

    await waitFor(() => expect(hoursIn('this range')).toBe(50))
    expect(hoursIn('another range')).toBe(50)
    expect(sentBody(0)).toEqual({ weeklyHours: 50, expectedWeeklyHours: 40 })
  })

  it('puts the old value back and says why when the save fails', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 500 }))
    const { result, hoursIn } = setup()

    act(() => result.current.mutate({ hours: 50, expected: 40 }))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(describeSaveError(result.current.error)).toBe("Couldn't save. Try again.")
    expect(hoursIn('this range')).toBe(40)
    expect(hoursIn('another range')).toBe(40)
  })

  it('shows what someone else saved when the save conflicts', async () => {
    fetchMock.mockResolvedValue(
      json(
        {
          error: { code: 'conflict', message: 'changed' },
          current: { id: 4, name: 'Dee Okafor', weeklyHours: 36 },
        },
        409,
      ),
    )
    const { result, hoursIn } = setup()

    act(() => result.current.mutate({ hours: 50, expected: 40 }))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(describeSaveError(result.current.error)).toBe('Someone else changed these hours.')
    expect(hoursIn('this range')).toBe(36)
    expect(hoursIn('another range')).toBe(36)
  })

  it('explains when the server cannot be reached', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const { result } = setup()

    act(() => result.current.mutate({ hours: 50, expected: 40 }))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(describeSaveError(result.current.error)).toBe("Couldn't reach the server. Check your connection.")
  })

  it('sends saves for the same person one at a time, in order', async () => {
    const first = deferred()
    const second = deferred()
    fetchMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const { result, hoursIn } = setup()

    act(() => result.current.mutate({ hours: 60, expected: 40 }))
    act(() => result.current.mutate({ hours: 70, expected: 60 }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(sentBody(0).weeklyHours).toBe(60)

    first.resolve(saved(60))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(sentBody(1)).toEqual({ weeklyHours: 70, expectedWeeklyHours: 60 })

    second.resolve(saved(70))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(hoursIn('this range')).toBe(70)
  })
})
