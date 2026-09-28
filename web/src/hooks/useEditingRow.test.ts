import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useEditingRow } from './useEditingRow'

describe('useEditingRow', () => {
  afterEach(cleanup)

  it('edits one row at a time', () => {
    const { result } = renderHook(() => useEditingRow())

    act(() => result.current.startEditing(1))
    act(() => result.current.startEditing(4))
    expect(result.current.editingId).toBe(4)

    act(() => result.current.stopEditing())
    expect(result.current.editingId).toBeNull()
  })

  it('keeps the same functions between renders', () => {
    const { result, rerender } = renderHook(() => useEditingRow())
    const { startEditing, stopEditing } = result.current
    rerender()
    expect(result.current.startEditing).toBe(startEditing)
    expect(result.current.stopEditing).toBe(stopEditing)
  })
})
