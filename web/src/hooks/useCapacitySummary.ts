import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchSummary } from '../api/capacity'
import { capacityKeys } from '../api/keys'
import type { Range } from '../lib/range'

export function useCapacitySummary(range: Range) {
  return useQuery({
    queryKey: capacityKeys.summary(range.from, range.to),
    queryFn: ({ signal }) => fetchSummary(range.from, range.to, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}
