import { useMemo } from 'react'
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import { fetchCapacityPage, type CapacityQuery } from '../api/capacity'
import { capacityKeys } from '../api/keys'
import type { Filters } from '../lib/filters'
import type { Range } from '../lib/range'
import { useDebouncedValue } from './useDebouncedValue'

export function useCapacityPages(range: Range, filters: Filters) {
  const q = useDebouncedValue(filters.q.trim(), 300)
  const query: CapacityQuery = { from: range.from, to: range.to, q, overOnly: filters.overOnly }

  const result = useInfiniteQuery({
    queryKey: capacityKeys.list(query),
    queryFn: ({ pageParam, signal }) => fetchCapacityPage(query, pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  const pages = result.data?.pages
  const people = useMemo(() => pages?.flatMap((page) => page.people) ?? [], [pages])
  const firstPage = pages?.[0]

  return {
    people,
    weeks: firstPage?.weeks ?? [],
    matched: firstPage?.matched ?? 0,
    totals: firstPage?.totals ?? [],
    isPending: result.isPending,
    isFetching: result.isFetching,
    isFetchingNextPage: result.isFetchingNextPage,
    hasNextPage: result.hasNextPage,
    fetchNextPage: result.fetchNextPage,
    error: result.error,
    refetch: result.refetch,
  }
}
