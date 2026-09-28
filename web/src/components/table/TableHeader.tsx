import { isCurrentWeek } from '../../lib/dates'
import { WeekHeaderCell } from './WeekHeaderCell'

type Props = { weeks: string[]; today: string }

export function TableHeader({ weeks, today }: Props) {
  return (
    <tr className="bg-surface-head">
      <th
        scope="col"
        className="bg-surface-head text-muted sticky left-0 z-20 min-w-[260px] px-5 py-3.5 text-left text-[13px] font-semibold"
      >
        Person
      </th>
      <th scope="col" className="text-muted min-w-[150px] px-4 text-left text-[13px] font-semibold">
        Capacity / wk
      </th>
      {weeks.map((week) => (
        <WeekHeaderCell key={week} week={week} isCurrent={isCurrentWeek(week, today)} />
      ))}
    </tr>
  )
}
