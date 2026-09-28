import { TableHeader } from './TableHeader'

const nameWidths = [150, 120, 170, 110, 140, 160, 125, 145, 115, 165]

type Props = { weeks: string[]; today: string }

export function TableSkeleton({ weeks, today }: Props) {
  return (
    <div aria-busy="true" aria-label="Loading capacity" className="max-h-[70vh] overflow-hidden">
      <table className="w-full border-collapse text-sm">
        <thead>
          <TableHeader weeks={weeks} today={today} />
        </thead>
        <tbody>
          {nameWidths.map((width, row) => (
            <tr key={row} className="border-row-border h-16 border-b">
              <td className="px-5">
                <div className="bg-skeleton h-3 animate-pulse rounded" style={{ width }} />
              </td>
              <td className="px-4">
                <div className="bg-skeleton-soft h-7 w-21 animate-pulse rounded-md" />
              </td>
              {weeks.map((week) => (
                <td key={week} className="border-row-border border-l px-4">
                  <div className="bg-skeleton ml-auto h-2.5 w-14 animate-pulse rounded" />
                  <div className="bg-skeleton-soft mt-2 h-1 animate-pulse rounded-sm" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
