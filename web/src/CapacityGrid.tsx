import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { fetchCapacity, status } from './capacity'

type Props = {
  from: string
  to: string
}

// CapacityGrid renders one row per person and one column per week, showing
// how allocated each person is and making over-allocation obvious.
//
// It reads from GET /api/capacity?from=&to= — the response shape is whatever
// you decided on in the API.
//
// A person's weekly hours are editable from the grid. After a save, every
// number that depends on them must be right — without a full page reload.
export function CapacityGrid({ from, to }: Props) {
  const { data, error, isPending, isFetching, refetch } = useQuery({
    queryKey: ['capacity', from, to],
    queryFn: ({ signal }) => fetchCapacity(from, to, signal),
    placeholderData: keepPreviousData,
  })

  if (isPending) {
    return <p className="status">Loading capacity…</p>
  }

  if (error) {
    return (
      <div className="status error" role="alert">
        <p>Could not load capacity: {error.message}</p>
        <button onClick={() => refetch()}>Try again</button>
      </div>
    )
  }

  return (
    <div className={isFetching ? 'grid is-fetching' : 'grid'} aria-busy={isFetching}>
      <table>
        <thead>
          <tr>
            <th>Person</th>
            <th>Capacity</th>
            {data.weeks.map((week) => (
              <th key={week}>{week}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.people.map((person) => (
            <tr key={person.id}>
              <th scope="row">{person.name}</th>
              <td>{person.weeklyHours}h</td>
              {person.allocated.map((hours, i) => (
                <td key={data.weeks[i]} className={`cell ${status(hours, person.weeklyHours)}`}>
                  {hours} / {person.weeklyHours}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
