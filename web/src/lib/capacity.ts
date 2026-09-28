import type { CapacityPage, PersonCapacity } from '../api/capacity'
import { formatWeek } from './dates'

export type RowOverage = { weeks: number; hours: number }

export function rowOverage(person: PersonCapacity): RowOverage {
  let weeks = 0
  let hours = 0
  for (const allocated of person.allocated) {
    if (allocated > person.weeklyHours) {
      weeks++
      hours += allocated - person.weeklyHours
    }
  }
  return { weeks, hours }
}

export function describeOverage({ weeks, hours }: RowOverage): string | null {
  if (weeks === 0) return null
  return `Over by ${formatHours(hours)}h in ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`
}

export function patchPersonInPages<T extends { pages: CapacityPage[] }>(data: T, id: number, weeklyHours: number): T {
  return {
    ...data,
    pages: data.pages.map((page) =>
      page.people.some((p) => p.id === id)
        ? { ...page, people: page.people.map((p) => (p.id === id ? { ...p, weeklyHours } : p)) }
        : page,
    ),
  }
}

export function teamLoadPercent(allocatedHours: number, capacityHours: number): number | null {
  return capacityHours > 0 ? Math.round((allocatedHours / capacityHours) * 100) : null
}

export function formatHours(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : String(Math.round(hours * 10) / 10)
}

export function loadPercent(hours: number, capacity: number): number {
  if (capacity > 0) return Math.min(hours / capacity, 1) * 100
  return hours > 0 ? 100 : 0
}

export function overageBadge(hours: number, capacity: number): string {
  return capacity === 0 ? 'No capacity' : `+${formatHours(hours - capacity)}h`
}

export function cellLabel(name: string, week: string, hours: number, capacity: number): string {
  const base = `${name}, week of ${formatWeek(week)}: ${formatHours(hours)}h allocated of ${formatHours(capacity)}h`
  return hours > capacity ? `${base} (over by ${formatHours(hours - capacity)}h)` : base
}
