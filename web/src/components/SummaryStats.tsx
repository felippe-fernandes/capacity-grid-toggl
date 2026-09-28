import type { CapacitySummary } from '../api/capacity'
import { teamLoadPercent } from '../lib/capacity'

type Props = { summary: CapacitySummary | undefined }

export function SummaryStats({ summary }: Props) {
  const load = summary ? teamLoadPercent(summary.allocatedHours, summary.capacityHours) : null
  return (
    <dl className="m-0 flex items-end">
      <Stat label="Over-allocated" value={summary?.overPeople} unit=" people" over />
      <Stat label="At capacity" value={summary?.fullPeople} unit=" people" divided />
      <Stat label="Team load" value={load} unit="%" divided />
    </dl>
  )
}

type StatProps = {
  label: string
  value: number | null | undefined
  unit: string
  over?: boolean
  divided?: boolean
}

function Stat({ label, value, unit, over = false, divided = false }: StatProps) {
  return (
    <div className={`flex flex-col gap-0.5 ${divided ? 'border-border ml-9 border-l pl-9' : ''}`}>
      <dt className={`text-[13px] font-medium ${over ? 'text-over-fg' : 'text-muted'}`}>{label}</dt>
      <dd className={`m-0 font-mono text-[28px] leading-[1.1] font-semibold ${over ? 'text-over-fg' : ''}`}>
        {value ?? '–'}
        <span className={`text-[13px] font-normal ${over ? 'text-over-cap-fg' : 'text-muted'}`}>{unit}</span>
      </dd>
    </div>
  )
}
