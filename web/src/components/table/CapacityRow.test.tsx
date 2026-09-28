import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PersonCapacity } from '../../api/capacity'
import { useEditingRow } from '../../hooks/useEditingRow'
import { CapacityRow } from './CapacityRow'

const ana: PersonCapacity = { id: 1, name: 'Ana Ferreira', weeklyHours: 40, allocated: [30] }
const fetchMock = vi.fn()
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
const sentBody = (call: number) => JSON.parse(fetchMock.mock.calls[call][1].body)

function Row() {
  const { editingId, startEditing, stopEditing } = useEditingRow()
  return (
    <table>
      <CapacityRow
        person={ana}
        weeks={['2026-01-05']}
        index={0}
        isEditing={editingId === ana.id}
        onStartEditing={startEditing}
        onStopEditing={stopEditing}
        measureRef={() => {}}
      />
    </table>
  )
}

function renderRow() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  render(<Row />, { wrapper })
}

describe('CapacityRow', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('shows a banner when a save fails and retries the same change', async () => {
    fetchMock.mockResolvedValueOnce(json({ error: { code: 'internal', message: 'boom' } }, 500))
    renderRow()

    await userEvent.click(screen.getByRole('button', { name: /edit weekly capacity for ana ferreira/i }))
    const input = screen.getByRole('textbox', { name: 'Weekly hours for Ana Ferreira' })
    await userEvent.clear(input)
    await userEvent.type(input, '32{Enter}')

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save Ana's capacity (40h to 32h)")
    expect(sentBody(0)).toEqual({ weeklyHours: 32, expectedWeeklyHours: 40 })

    fetchMock.mockResolvedValueOnce(json({ id: 1, name: 'Ana Ferreira', weeklyHours: 32 }))
    await userEvent.click(screen.getByRole('button', { name: 'Retry 32h' }))

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(sentBody(1)).toEqual({ weeklyHours: 32, expectedWeeklyHours: 40 })
  })
})
