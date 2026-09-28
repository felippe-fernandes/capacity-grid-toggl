import { memo } from 'react'
import type { PersonCapacity } from '../../api/capacity'
import { useCapacitySave } from '../../hooks/useCapacitySave'
import { cellLabel, describeOverage, rowOverage } from '../../lib/capacity'
import { AllocationCell } from './AllocationCell'
import { CapacityCell } from './CapacityCell'
import { NameCell } from './NameCell'
import { RowBanner } from './RowBanner'

type Props = {
  person: PersonCapacity
  weeks: string[]
  index: number
  isEditing: boolean
  onStartEditing: (id: number) => void
  onStopEditing: () => void
  measureRef: (element: HTMLTableSectionElement | null) => void
}

export const CapacityRow = memo(function CapacityRow({
  person,
  weeks,
  index,
  isEditing,
  onStartEditing,
  onStopEditing,
  measureRef,
}: Props) {
  const { save, savingHours, failure, retry, dismiss } = useCapacitySave(person)

  return (
    <tbody ref={measureRef} data-index={index}>
      <tr className={`border-row-border border-b ${savingHours !== null ? 'opacity-70' : ''}`}>
        <NameCell name={person.name} overNote={describeOverage(rowOverage(person))} />
        <td className="px-3 py-2">
          <CapacityCell
            person={person}
            isEditing={isEditing}
            savingHours={savingHours}
            onStartEditing={onStartEditing}
            onStopEditing={onStopEditing}
            onSave={save}
          />
        </td>
        {person.allocated.map((hours, i) => (
          <AllocationCell
            key={weeks[i]}
            hours={hours}
            capacity={person.weeklyHours}
            label={cellLabel(person.name, weeks[i], hours, person.weeklyHours)}
          />
        ))}
      </tr>
      {failure && (
        <tr>
          <td colSpan={weeks.length + 2} className="p-0">
            <RowBanner name={person.name} failure={failure} onRetry={retry} onDismiss={dismiss} />
          </td>
        </tr>
      )}
    </tbody>
  )
})
