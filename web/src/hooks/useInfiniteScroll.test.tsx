import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useInfiniteScroll } from './useInfiniteScroll'

type Callback = (entries: { isIntersecting: boolean }[]) => void

class FakeObserver {
  static instances: FakeObserver[] = []
  callback: Callback
  observe = vi.fn()
  disconnect = vi.fn()

  constructor(callback: Callback) {
    this.callback = callback
    FakeObserver.instances.push(this)
  }

  show() {
    this.callback([{ isIntersecting: true }])
  }
}

type Props = { hasNextPage: boolean; isFetchingNextPage: boolean; fetchNextPage: () => void }

function List(props: Props) {
  const { rootRef, sentinelRef } = useInfiniteScroll(props)
  return (
    <div ref={rootRef}>
      <div ref={sentinelRef} />
    </div>
  )
}

describe('useInfiniteScroll', () => {
  beforeEach(() => {
    FakeObserver.instances = []
    vi.stubGlobal('IntersectionObserver', FakeObserver)
  })
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('asks for the next page when the end of the list comes into view', () => {
    const fetchNextPage = vi.fn()
    render(<List hasNextPage isFetchingNextPage={false} fetchNextPage={fetchNextPage} />)

    FakeObserver.instances[0].show()

    expect(fetchNextPage).toHaveBeenCalledTimes(1)
  })

  it('does not watch while a page is loading or when there are no more pages', () => {
    const fetchNextPage = vi.fn()
    const { rerender } = render(<List hasNextPage isFetchingNextPage fetchNextPage={fetchNextPage} />)
    expect(FakeObserver.instances).toHaveLength(0)

    rerender(<List hasNextPage={false} isFetchingNextPage={false} fetchNextPage={fetchNextPage} />)
    expect(FakeObserver.instances).toHaveLength(0)
  })

  it('stops watching when the list goes away', () => {
    const { unmount } = render(<List hasNextPage isFetchingNextPage={false} fetchNextPage={vi.fn()} />)
    unmount()
    expect(FakeObserver.instances[0].disconnect).toHaveBeenCalled()
  })
})
