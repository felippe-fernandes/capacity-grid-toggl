import { z } from 'zod'
import { request } from './client'

const personCapacitySchema = z.object({
  id: z.number(),
  name: z.string(),
  weeklyHours: z.number(),
  allocated: z.array(z.number()),
})

const weekTotalSchema = z.object({ allocated: z.number(), capacity: z.number() })

const capacityPageSchema = z.object({
  weeks: z.array(z.iso.date()),
  people: z.array(personCapacitySchema),
  matched: z.number().optional(),
  totals: z.array(weekTotalSchema).optional(),
  nextCursor: z.string().optional(),
})

const summarySchema = z.object({
  people: z.number(),
  overPeople: z.number(),
  fullPeople: z.number(),
  allocatedHours: z.number(),
  capacityHours: z.number(),
})

export type PersonCapacity = z.infer<typeof personCapacitySchema>
export type WeekTotal = z.infer<typeof weekTotalSchema>
export type CapacityPage = z.infer<typeof capacityPageSchema>
export type CapacitySummary = z.infer<typeof summarySchema>

export type CapacityQuery = { from: string; to: string; q: string; overOnly: boolean }

export function fetchCapacityPage(query: CapacityQuery, cursor: string | undefined, signal: AbortSignal) {
  const params = new URLSearchParams({ from: query.from, to: query.to })
  if (query.q) params.set('q', query.q)
  if (query.overOnly) params.set('over', '1')
  if (cursor) params.set('cursor', cursor)
  return request(`/api/capacity?${params}`, capacityPageSchema, { signal })
}

export function fetchSummary(from: string, to: string, signal: AbortSignal) {
  return request(`/api/capacity/summary?${new URLSearchParams({ from, to })}`, summarySchema, { signal })
}
