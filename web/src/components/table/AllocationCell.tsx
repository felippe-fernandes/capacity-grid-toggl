import { formatHours, loadPercent, overageBadge } from '../../lib/capacity'
import { status, type Status } from '../../lib/status'

const barColor: Record<Exclude<Status, 'free'>, string> = {
  ok: 'bg-bar-under',
  full: 'bg-accent',
  over: 'bg-over',
}

type Props = { hours: number; capacity: number; label: string }

export function AllocationCell({ hours, capacity, label }: Props) {
  const state = status(hours, capacity)
  const over = state === 'over'

  return (
    <td title={label} className={`border-row-border h-16 border-l px-4 align-middle ${over ? 'bg-over-tint' : ''}`}>
      <div className="flex items-baseline justify-end gap-1.5 font-mono text-sm">
        {over && (
          <span className="bg-over-badge-bg text-over-badge-fg mr-auto rounded px-1.5 py-0.5 font-sans text-[11px] font-semibold">
            {overageBadge(hours, capacity)}
          </span>
        )}
        <span className={`font-semibold ${over ? 'text-over-fg' : state === 'free' ? 'text-dim' : 'text-fg'}`}>
          {formatHours(hours)}
        </span>
        <span className={`text-xs ${over ? 'text-over-cap-fg' : 'text-dim'}`}>/ {formatHours(capacity)}</span>
      </div>
      <div className={`mt-[7px] h-1 overflow-hidden rounded-sm ${state === 'free' ? '' : 'bg-bar-track'}`}>
        {state !== 'free' && (
          <div className={`h-1 rounded-sm ${barColor[state]}`} style={{ width: `${loadPercent(hours, capacity)}%` }} />
        )}
      </div>
    </td>
  )
}
