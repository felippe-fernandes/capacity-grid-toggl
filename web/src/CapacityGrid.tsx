import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchCapacityPage } from './api/capacity'
import { capacityKeys } from './api/keys'
import { CapacityInput } from './components/CapacityInput'
import { useDebouncedValue } from './hooks/useDebouncedValue'
import { formatWeek } from './lib/dates'
import type { Filters } from './lib/filters'
import { status, type Status } from './lib/status'

type Props = {
  from: string
  to: string
  filters: Filters
}

const cellStyles: Record<Status, string> = {
  free: 'text-gray-400 dark:text-gray-600',
  ok: '',
  full: 'bg-amber-100 dark:bg-amber-900/40',
  over: 'bg-red-100 font-semibold text-red-800 dark:bg-red-900/50 dark:text-red-200',
}

// CapacityGrid renders one row per person and one column per week, showing
// how allocated each person is and making over-allocation obvious.
//
// It reads from GET /api/capacity?from=&to= — the response shape is whatever
// you decided on in the API.
//
// A person's weekly hours are editable from the grid. After a save, every
// number that depends on them must be right — without a full page reload.
export function CapacityGrid({ from, to, filters }: Props) {
  const q = useDebouncedValue(filters.q.trim(), 300)
  const { overOnly } = filters

  const query = { from, to, q, overOnly }
  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: capacityKeys.list(query),
    queryFn: ({ signal }) => fetchCapacityPage(query, undefined, signal),
    placeholderData: keepPreviousData,
  })

  if (isPending) {
    return <p className="py-4 text-gray-500">Loading capacity…</p>
  }

  if (error && !data) {
    return (
      <div role="alert" className="py-4 text-red-700 dark:text-red-400">
        <p>Could not load capacity: {error.message}</p>
        <button onClick={() => refetch()} className="mt-2 rounded border border-current px-3 py-1">
          Try again
        </button>
      </div>
    )
  }

  return (
    <>
      {error && (
        <p role="alert" className="mb-2 text-sm text-red-700 dark:text-red-400">
          Couldn't refresh, showing the last data we had.{' '}
          <button onClick={() => refetch()} className="underline">
            Try again
          </button>
        </p>
      )}
      <p className="mb-2 text-sm text-gray-500">
        Showing {data.people.length} of {data.matched ?? data.people.length} people
      </p>
      <div
        aria-busy={isFetching}
        className={`max-h-[75vh] overflow-auto rounded border border-gray-200 transition-opacity dark:border-gray-800 ${isFetching ? 'opacity-50' : ''}`}
      >
        <table className="w-full border-collapse text-sm tabular-nums">
          <thead className="sticky top-0 z-10 bg-[Canvas]">
            <tr>
              <th className="sticky left-0 z-20 bg-[Canvas] px-3 py-2 text-left font-medium">Person</th>
              <th className="px-3 py-2 text-right font-medium">Capacity</th>
              {data.weeks.map((week, i) => (
                <th key={week} title={week} className="px-3 py-2 text-right font-medium whitespace-nowrap">
                  {formatWeek(week)}
                  {(i === 0 || week.slice(0, 4) !== data.weeks[i - 1].slice(0, 4)) && (
                    <span className="block text-xs font-normal text-gray-500">{week.slice(0, 4)}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.people.length === 0 && (
              <tr>
                <td colSpan={data.weeks.length + 2} className="px-3 py-6 text-center text-gray-500">
                  No one matches these filters.
                </td>
              </tr>
            )}
            {data.people.map((person) => (
              <tr key={person.id} className="border-t border-gray-200 dark:border-gray-800">
                <th
                  scope="row"
                  className="sticky left-0 z-[1] bg-[Canvas] px-3 py-2 text-left font-normal whitespace-nowrap"
                >
                  {person.name}
                </th>
                <td className="px-3 py-2 text-right">
                  <CapacityInput person={person} />
                </td>
                {person.allocated.map((hours, i) => (
                  <td
                    key={data.weeks[i]}
                    className={`px-3 py-2 text-right whitespace-nowrap ${cellStyles[status(hours, person.weeklyHours)]}`}
                  >
                    {hours} / {person.weeklyHours}
                    {hours > person.weeklyHours && <span className="ml-1 text-xs">+{hours - person.weeklyHours}h</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
