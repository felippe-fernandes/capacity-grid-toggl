import { formatWeek, weekSpanLabel } from '../../lib/dates'

type Props = { week: string; isCurrent: boolean }

export function WeekHeaderCell({ week, isCurrent }: Props) {
  return (
    <th
      scope="col"
      className={`border-border min-w-[132px] border-l px-4 py-3 text-left align-top ${isCurrent ? 'bg-current-week' : ''}`}
    >
      <div className="text-fg flex items-center gap-2 text-sm font-semibold">
        {formatWeek(week)}
        {isCurrent && (
          <span className="bg-chip-bg text-chip-fg rounded px-1.5 py-0.5 text-[11px] font-semibold">This week</span>
        )}
      </div>
      <div className="text-muted text-xs font-normal">{weekSpanLabel(week)}</div>
    </th>
  )
}
