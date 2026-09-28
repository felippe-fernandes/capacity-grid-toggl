import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AllocationCell } from './AllocationCell'

function renderCell(hours: number, capacity: number) {
  render(
    <table>
      <tbody>
        <tr>
          <AllocationCell hours={hours} capacity={capacity} label={`${hours} of ${capacity}`} />
        </tr>
      </tbody>
    </table>,
  )
  return screen.getByRole('cell')
}

describe('AllocationCell', () => {
  it('shows how many hours over capacity the week is', () => {
    renderCell(45, 40)
    expect(screen.getByText('+5h')).toBeInTheDocument()
  })

  it('names the zero capacity case instead of a number', () => {
    renderCell(20, 0)
    expect(screen.getByText('No capacity')).toBeInTheDocument()
  })

  it('has no badge at or under capacity', () => {
    renderCell(40, 40)
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument()
    expect(screen.queryByText('No capacity')).not.toBeInTheDocument()
  })

  it('describes the week in its tooltip', () => {
    expect(renderCell(30, 40)).toHaveAttribute('title', '30 of 40')
  })
})
