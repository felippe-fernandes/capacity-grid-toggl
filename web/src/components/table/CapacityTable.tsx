import type { PersonCapacity, WeekTotal } from '../../api/capacity'
import { useEditingRow } from '../../hooks/useEditingRow'
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll'
import { useVirtualRows } from '../../hooks/useVirtualRows'
import { CapacityRow } from './CapacityRow'
import { TableHeader } from './TableHeader'
import { TeamTotalRow } from './TeamTotalRow'

type Props = {
  people: PersonCapacity[]
  weeks: string[]
  totals: WeekTotal[]
  matched: number
  today: string
  rangeLabel: string
  isRefreshing: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => unknown
}

export function CapacityTable({
  people,
  weeks,
  totals,
  matched,
  today,
  rangeLabel,
  isRefreshing,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: Props) {
  const { editingId, startEditing, stopEditing } = useEditingRow()
  const { rootRef, sentinelRef } = useInfiniteScroll({ hasNextPage, isFetchingNextPage, fetchNextPage })
  const { items, paddingTop, paddingBottom, measureElement } = useVirtualRows(people.length, rootRef)
  const columns = weeks.length + 2

  return (
    <div ref={rootRef} className="max-h-[70vh] overflow-auto">
      <table
        className={`w-full border-collapse text-sm tabular-nums transition-opacity ${isRefreshing ? 'opacity-55' : ''}`}
      >
        <thead className="sticky top-0 z-10">
          <TableHeader weeks={weeks} today={today} />
          {totals.length > 0 && <TeamTotalRow weeks={weeks} totals={totals} matched={matched} />}
        </thead>
        {paddingTop > 0 && (
          <tbody aria-hidden="true">
            <tr style={{ height: paddingTop }} />
          </tbody>
        )}
        {items.map((item) => {
          const person = people[item.index]
          return (
            <CapacityRow
              key={person.id}
              person={person}
              weeks={weeks}
              index={item.index}
              isEditing={editingId === person.id}
              onStartEditing={startEditing}
              onStopEditing={stopEditing}
              measureRef={measureElement}
            />
          )
        })}
        {paddingBottom > 0 && (
          <tbody aria-hidden="true">
            <tr style={{ height: paddingBottom }} />
          </tbody>
        )}
        {people.length === 0 && (
          <tbody>
            <tr>
              <td colSpan={columns} className="text-muted px-6 py-16 text-center text-sm">
                No one matches these filters in {rangeLabel}.
              </td>
            </tr>
          </tbody>
        )}
      </table>
      <div ref={sentinelRef} aria-hidden="true" />
      {isFetchingNextPage && <p className="text-muted m-0 py-3 text-center text-sm">Loading more…</p>}
    </div>
  )
}
