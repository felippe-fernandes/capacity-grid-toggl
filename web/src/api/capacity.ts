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
  total: z.number(),
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

export async function updateWeeklyHours(id: number, weeklyHours: number) {
  const res = await fetch(`/api/people/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ weeklyHours }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `Save failed (${res.status})`)
  }
  return personSchema.parse(await res.json())
}
