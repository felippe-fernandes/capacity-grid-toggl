import { ApiError, NetworkError } from '../api/client'

export function describeSaveError(error: unknown): string {
  if (error instanceof NetworkError) return "Couldn't reach the server. Check your connection."
  if (error instanceof ApiError) {
    if (error.code === 'not_found') return 'This person no longer exists.'
    if (error.code === 'conflict') return 'Someone else changed these hours.'
    if (error.code === 'invalid_hours') return 'Weekly hours must be a whole number from 0 to 80.'
  }
  return "Couldn't save. Try again."
}
