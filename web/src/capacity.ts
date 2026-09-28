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

export type Status = 'free' | 'ok' | 'full' | 'over'

export function status(allocated: number, capacity: number): Status {
  if (allocated > capacity) return 'over'
  if (allocated === 0) return 'free'
  if (allocated === capacity) return 'full'
  return 'ok'
}

const DAY_MS = 24 * 60 * 60 * 1000

function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addDays(iso: string, days: number): string {
  return toISO(new Date(toDate(iso).getTime() + days * DAY_MS))
}

export function mondayOf(iso: string): string {
  const weekday = toDate(iso).getUTCDay()
  return addDays(iso, -((weekday + 6) % 7))
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / DAY_MS)
}

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
