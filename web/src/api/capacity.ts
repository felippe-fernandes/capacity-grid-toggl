import { z } from 'zod'
import type { Filters } from '../lib/filters'

const personCapacitySchema = z.object({
  id: z.number(),
  name: z.string(),
  weeklyHours: z.number(),
  allocated: z.array(z.number()),
})

const capacityDataSchema = z.object({
  weeks: z.array(z.iso.date()),
  people: z.array(personCapacitySchema),
  matched: z.number(),
})

export type PersonCapacity = z.infer<typeof personCapacitySchema>
export type CapacityData = z.infer<typeof capacityDataSchema>

export async function fetchCapacity(
  from: string,
  to: string,
  filters: Filters,
  signal: AbortSignal,
): Promise<CapacityData> {
  const params = new URLSearchParams({ from, to })
  const q = filters.q.trim()
  if (q) params.set('q', q)
  if (filters.overOnly) params.set('over', '1')

  const res = await fetch(`/api/capacity?${params}`, { signal })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `Request failed (${res.status})`)
  }
  const parsed = capacityDataSchema.safeParse(await res.json())
  if (!parsed.success) {
    console.error(parsed.error)
    throw new Error('Unexpected response from the server')
  }
  return parsed.data
}

const personSchema = z.object({ id: z.number(), name: z.string(), weeklyHours: z.number() })

export const weeklyHoursSchema = z
  .number({ error: 'Enter a number of hours' })
  .int('Weekly hours must be a whole number from 0 to 80')
  .min(0, 'Weekly hours must be a whole number from 0 to 80')
  .max(80, 'Weekly hours must be a whole number from 0 to 80')

export async function updateWeeklyHours(id: number, weeklyHours: number) {
  let res: Response
  try {
    res = await fetch(`/api/people/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weeklyHours }),
    })
  } catch {
    throw new Error("Couldn't reach the server. Check your connection.")
  }
  if (res.status === 404) throw new Error('This person no longer exists.')
  if (!res.ok) throw new Error("Couldn't save. Try again.")
  return personSchema.parse(await res.json())
}
