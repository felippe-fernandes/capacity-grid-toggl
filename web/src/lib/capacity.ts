import type { CapacityPage, PersonCapacity } from '../api/capacity'

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
  return `Over by ${hours}h in ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`
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
