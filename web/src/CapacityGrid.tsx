import { ProgressBar } from './components/ui/ProgressBar'
import { CapacityTable } from './components/table/CapacityTable'
import { RefreshBanner, TableError } from './components/table/TableError'
import { TableFooter } from './components/table/TableFooter'
import { TableSkeleton } from './components/table/TableSkeleton'
import { useCapacityPages } from './hooks/useCapacityPages'
import type { Filters } from './lib/filters'
import { weeksInRange, type Range } from './lib/range'

type Props = {
  range: Range
  rangeLabel: string
  today: string
  filters: Filters
  teamSize: number | undefined
}

// CapacityGrid renders one row per person and one column per week, showing
// how allocated each person is and making over-allocation obvious.
//
// It reads from GET /api/capacity?from=&to= — the response shape is whatever
// you decided on in the API.
//
// A person's weekly hours are editable from the grid. After a save, every
// number that depends on them must be right — without a full page reload.
export function CapacityGrid({ range, rangeLabel, today, filters, teamSize }: Props) {
  const capacity = useCapacityPages(range, filters)
  const weeks = capacity.weeks.length > 0 ? capacity.weeks : weeksInRange(range)
  const isRefreshing = capacity.isFetching && !capacity.isFetchingNextPage && !capacity.isPending
  const retry = () => capacity.refetch()

  return (
    <section
      aria-label="Capacity by person and week"
      className="border-border bg-surface relative flex flex-col overflow-hidden rounded-xl border"
    >
      {isRefreshing && <ProgressBar />}

      {capacity.isPending ? (
        <TableSkeleton weeks={weeks} today={today} />
      ) : capacity.error && capacity.people.length === 0 ? (
        <TableError rangeLabel={rangeLabel} onRetry={retry} />
      ) : (
        <>
          {capacity.error && <RefreshBanner onRetry={retry} />}
          <CapacityTable
            people={capacity.people}
            weeks={weeks}
            totals={capacity.totals}
            matched={capacity.matched}
            today={today}
            rangeLabel={rangeLabel}
            isRefreshing={isRefreshing}
            hasNextPage={capacity.hasNextPage}
            isFetchingNextPage={capacity.isFetchingNextPage}
            fetchNextPage={capacity.fetchNextPage}
          />
        </>
      )}

      <TableFooter matched={capacity.matched} teamSize={teamSize} />
    </section>
  )
}
