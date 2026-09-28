import { useEffect, useRef } from 'react'

type Options = {
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => unknown
  rootMargin?: string
}

export function useInfiniteScroll({ hasNextPage, isFetchingNextPage, fetchNextPage, rootMargin = '600px' }: Options) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchNextPage()
      },
      { root: rootRef.current, rootMargin },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, rootMargin])

  return { rootRef, sentinelRef }
}
