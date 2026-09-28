import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { PersonCapacity } from '../../api/capacity'
import { CapacityCell } from './CapacityCell'

const ana: PersonCapacity = { id: 1, name: 'Ana Ferreira', weeklyHours: 40, allocated: [40] }

function renderCell(overrides: Partial<Parameters<typeof CapacityCell>[0]> = {}) {
  const props = {
    person: ana,
    isEditing: false,
    savingHours: null,
    onStartEditing: vi.fn(),
    onStopEditing: vi.fn(),
    onSave: vi.fn(),
    ...overrides,
  }
  render(<CapacityCell {...props} />)
  return props
}

const hoursInput = () => screen.getByRole('textbox', { name: 'Weekly hours for Ana Ferreira' })

describe('CapacityCell', () => {
  it('starts editing from the capacity button', async () => {
    const props = renderCell()
    await userEvent.click(screen.getByRole('button', { name: /edit weekly capacity for ana ferreira/i }))
    expect(props.onStartEditing).toHaveBeenCalledWith(1)
  })

  it('saves a valid change with Enter', async () => {
    const props = renderCell({ isEditing: true })
    await userEvent.clear(hoursInput())
    await userEvent.type(hoursInput(), '32{Enter}')
    expect(props.onStopEditing).toHaveBeenCalled()
    expect(props.onSave).toHaveBeenCalledWith(32)
  })

  it('blocks an invalid value and says why', async () => {
    const props = renderCell({ isEditing: true })
    await userEvent.clear(hoursInput())
    await userEvent.type(hoursInput(), '120')

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(hoursInput()).toHaveAccessibleDescription('Weekly hours must be a whole number from 0 to 80.')

    await userEvent.keyboard('{Enter}')
    expect(props.onSave).not.toHaveBeenCalled()
  })

  it('cancels with Escape without saving', async () => {
    const props = renderCell({ isEditing: true })
    await userEvent.type(hoursInput(), '{Backspace}{Backspace}32{Escape}')
    expect(props.onStopEditing).toHaveBeenCalled()
    expect(props.onSave).not.toHaveBeenCalled()
  })

  it('closes without a request when the value did not change', async () => {
    const props = renderCell({ isEditing: true })
    await userEvent.type(hoursInput(), '{Enter}')
    expect(props.onStopEditing).toHaveBeenCalled()
    expect(props.onSave).not.toHaveBeenCalled()
  })

  it('announces the hours being saved', () => {
    renderCell({ savingHours: 32 })
    expect(screen.getByRole('status')).toHaveTextContent('32h saving')
  })
})
