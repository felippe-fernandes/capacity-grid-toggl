import { z } from 'zod'

const personCapacitySchema = z.object({
  id: z.number(),
  name: z.string(),
  weeklyHours: z.number(),
  allocated: z.array(z.number()),
})

const capacityDataSchema = z.object({
  weeks: z.array(z.iso.date()),
  people: z.array(personCapacitySchema),
})

export type PersonCapacity = z.infer<typeof personCapacitySchema>
export type CapacityData = z.infer<typeof capacityDataSchema>

export async function fetchCapacity(from: string, to: string, signal: AbortSignal): Promise<CapacityData> {
  const res = await fetch(`/api/capacity?from=${from}&to=${to}`, { signal })
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
