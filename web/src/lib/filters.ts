import type { PersonCapacity } from '../api/capacity'

export type Filters = { q: string; overOnly: boolean }

export const DEFAULT_FILTERS: Filters = { q: '', overOnly: false }

export function parseFilters(params: URLSearchParams): Filters {
  return { q: params.get('q') ?? '', overOnly: params.get('over') === '1' }
}

export function serializeFilters(filters: Filters): Record<string, string> {
  return { q: filters.q.trim(), over: filters.overOnly ? '1' : '' }
}

export function filterPeople(people: PersonCapacity[], { q, overOnly }: Filters): PersonCapacity[] {
  const query = q.trim().toLocaleLowerCase()
  return people.filter(
    (p) =>
      (!query || p.name.toLocaleLowerCase().includes(query)) &&
      (!overOnly || p.allocated.some((hours) => hours > p.weeklyHours)),
  )
}
