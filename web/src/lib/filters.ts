export type Filters = { q: string; overOnly: boolean }

export const DEFAULT_FILTERS: Filters = { q: '', overOnly: false }

export function parseFilters(params: URLSearchParams): Filters {
  return { q: params.get('q') ?? '', overOnly: params.get('over') === '1' }
}

export function serializeFilters(filters: Filters): Record<string, string> {
  return { q: filters.q.trim(), over: filters.overOnly ? '1' : '' }
}
