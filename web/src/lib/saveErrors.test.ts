import { describe, expect, it } from 'vitest'
import { ApiError, NetworkError } from '../api/client'
import { describeSaveError } from './saveErrors'

describe('describeSaveError', () => {
  it('picks the message from the error code, not the server text', () => {
    expect(describeSaveError(new ApiError(409, 'conflict', 'weekly hours changed', null))).toBe(
      'Someone else changed these hours.',
    )
    expect(describeSaveError(new ApiError(404, 'not_found', 'person not found', null))).toBe(
      'This person no longer exists.',
    )
  })

  it('explains network failures', () => {
    expect(describeSaveError(new NetworkError())).toBe("Couldn't reach the server. Check your connection.")
  })

  it('falls back to a generic message', () => {
    expect(describeSaveError(new ApiError(500, 'internal', 'boom', null))).toBe("Couldn't save. Try again.")
    expect(describeSaveError(new Error('anything'))).toBe("Couldn't save. Try again.")
  })
})
