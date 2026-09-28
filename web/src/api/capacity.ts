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

const personSchema = z.object({ id: z.number(), name: z.string(), weeklyHours: z.number() })

export const weeklyHoursSchema = z
  .number({ error: 'Enter a number of hours' })
  .min(0, "Hours can't be negative")
  .max(168, 'A week only has 168 hours')

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
