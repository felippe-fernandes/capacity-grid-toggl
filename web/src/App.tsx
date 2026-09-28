import { CapacityGrid } from './CapacityGrid'
import { FiltersBar } from './components/FiltersBar'
import { PageHeader } from './components/PageHeader'
import { RangeToolbar } from './components/RangeToolbar'
import { SummaryStats } from './components/SummaryStats'
import { useCapacitySummary } from './hooks/useCapacitySummary'
import { useDateRange } from './hooks/useDateRange'
import { useFilters } from './hooks/useFilters'

export function App() {
  const { range, label, previousWeek, nextWeek, thisWeek, setFrom, setTo } = useDateRange()
  const { filters, setQuery, setOverOnly } = useFilters()
  const summary = useCapacitySummary(range)

  return (
    <main className="mx-auto flex max-w-[1440px] flex-col gap-6 px-10 py-9">
      <PageHeader rangeLabel={label}>
        <SummaryStats summary={summary.data} />
      </PageHeader>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <RangeToolbar
          from={range.from}
          to={range.to}
          onPrevious={previousWeek}
          onNext={nextWeek}
          onThisWeek={thisWeek}
          onFromChange={setFrom}
          onToChange={setTo}
        />
        <FiltersBar
          query={filters.q}
          overOnly={filters.overOnly}
          onQueryChange={setQuery}
          onOverOnlyChange={setOverOnly}
        />
      </div>

      <CapacityGrid from={range.from} to={range.to} filters={filters} />
    </main>
  )
}
