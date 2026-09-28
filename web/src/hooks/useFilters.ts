import { useMemo } from 'react'
import { DEFAULT_FILTERS, parseFilters, serializeFilters } from '../lib/filters'
import { useSearchParamsState } from './useSearchParamsState'

export function useFilters() {
  const [filters, setFilters] = useSearchParamsState(parseFilters, serializeFilters, DEFAULT_FILTERS)

  const actions = useMemo(
    () => ({
      setQuery: (q: string) => setFilters((f) => ({ ...f, q })),
      setOverOnly: (overOnly: boolean) => setFilters((f) => ({ ...f, overOnly })),
    }),
    [setFilters],
  )

  return { filters, ...actions }
}
