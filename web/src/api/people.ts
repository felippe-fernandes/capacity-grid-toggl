import { z } from 'zod'
import { ApiError, request } from './client'

const personSchema = z.object({ id: z.number(), name: z.string(), weeklyHours: z.number() })
const conflictSchema = z.object({ current: personSchema })

export type Person = z.infer<typeof personSchema>

export function updateWeeklyHours(id: number, weeklyHours: number, expectedWeeklyHours?: number) {
  return request(`/api/people/${id}`, personSchema, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weeklyHours, expectedWeeklyHours }),
  })
}

export function currentFromConflict(error: unknown): Person | null {
  if (!(error instanceof ApiError) || error.code !== 'conflict') return null
  const parsed = conflictSchema.safeParse(error.body)
  return parsed.success ? parsed.data.current : null
}
