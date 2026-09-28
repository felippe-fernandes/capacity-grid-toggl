import type { WeekTotal } from '../../api/capacity'
import { formatHours, teamLoadPercent } from '../../lib/capacity'

type Props = { weeks: string[]; totals: WeekTotal[]; matched: number }

export function TeamTotalRow({ weeks, totals, matched }: Props) {
  return (
    <tr className="border-border-strong bg-surface-total border-b">
      <th
        scope="row"
        className="bg-surface-total text-muted sticky left-0 z-20 h-13 px-5 text-left text-[13px] font-semibold"
      >
        Team total <span className="ml-2 font-normal">({matched} matched)</span>
      </th>
      <td className="text-muted px-4 font-mono text-[13px]">{formatHours(totals[0]?.capacity ?? 0)}h</td>
      {totals.map((total, i) => {
        const percent = teamLoadPercent(total.allocated, total.capacity) ?? 0
        return (
          <td key={weeks[i]} className="border-border border-l px-4 text-right font-mono text-[13px]">
            <span className="text-muted">
              {formatHours(total.allocated)} / {formatHours(total.capacity)}
            </span>
            <span
              className={`ml-2.5 inline-block min-w-10 font-semibold ${percent > 100 ? 'text-over-fg' : 'text-fg'}`}
            >
              {percent}%
            </span>
          </td>
        )
      })}
    </tr>
  )
}
