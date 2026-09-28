import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RowBanner } from './RowBanner'

describe('RowBanner', () => {
  it('explains a failed save and retries the value that failed', async () => {
    const onRetry = vi.fn()
    const onDismiss = vi.fn()
    render(
      <RowBanner
        name="Ana Ferreira"
        failure={{ kind: 'failed', from: 40, to: 32, message: "Couldn't save. Try again." }}
        onRetry={onRetry}
        onDismiss={onDismiss}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      "Couldn't save Ana's capacity (40h to 32h). The grid is back to 40h.",
    )
    await userEvent.click(screen.getByRole('button', { name: 'Retry 32h' }))
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('lets the manager keep the other value or use their own on a conflict', async () => {
    const onRetry = vi.fn()
    const onDismiss = vi.fn()
    render(
      <RowBanner
        name="Ana Ferreira"
        failure={{ kind: 'conflict', theirs: 36, mine: 32 }}
        onRetry={onRetry}
        onDismiss={onDismiss}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent("Someone changed Ana's capacity to 36h")
    await userEvent.click(screen.getByRole('button', { name: 'Keep 36h' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('button', { name: 'Use 32h' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
