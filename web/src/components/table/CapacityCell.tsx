import { useId } from 'react'
import type { PersonCapacity } from '../../api/capacity'
import { useWeeklyHoursDraft } from '../../hooks/useWeeklyHoursDraft'
import { formatHours } from '../../lib/capacity'
import { Icon } from '../ui/Icon'

type Props = {
  person: PersonCapacity
  isEditing: boolean
  savingHours: number | null
  onStartEditing: (id: number) => void
  onStopEditing: () => void
  onSave: (hours: number) => void
}

export function CapacityCell({ person, isEditing, savingHours, onStartEditing, onStopEditing, onSave }: Props) {
  if (savingHours !== null) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="text-accent-strong flex h-11 items-center gap-2 px-2.5 text-[13px]"
      >
        <Icon name="spinner" size={14} strokeWidth={2.5} className="animate-spin" />
        <span className="font-mono">{formatHours(savingHours)}h</span> saving
      </div>
    )
  }

  if (isEditing) {
    return (
      <CapacityEditor
        person={person}
        onCancel={onStopEditing}
        onSave={(hours) => {
          onStopEditing()
          onSave(hours)
        }}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => onStartEditing(person.id)}
      aria-label={`Edit weekly capacity for ${person.name}, currently ${formatHours(person.weeklyHours)} hours`}
      className="group border-cap-border hover:bg-ghost-hover flex h-11 items-center gap-2 rounded-md border px-3"
    >
      <span className="font-mono text-sm font-medium">{formatHours(person.weeklyHours)}h</span>
      <Icon name="pencil" size={13} className="text-muted opacity-50 group-hover:opacity-100" />
    </button>
  )
}

type EditorProps = {
  person: PersonCapacity
  onSave: (hours: number) => void
  onCancel: () => void
}

function CapacityEditor({ person, onSave, onCancel }: EditorProps) {
  const { draft, setDraft, hours, error, unchanged } = useWeeklyHoursDraft(person.weeklyHours)
  const errorId = useId()

  function submit() {
    if (hours === null) return
    if (unchanged) onCancel()
    else onSave(hours)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="flex flex-col gap-1"
    >
      <div className="flex items-center gap-1">
        <input
          autoFocus
          type="text"
          inputMode="numeric"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onCancel()
          }}
          aria-label={`Weekly hours for ${person.name}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`bg-input-bg text-fg h-11 w-14 rounded-md border px-1.5 font-mono text-sm ${error ? 'border-danger' : 'border-accent'}`}
        />
        <button
          type="submit"
          aria-label="Save"
          disabled={hours === null}
          className="bg-accent text-on-accent flex size-11 items-center justify-center rounded-md disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Icon name="check" size={15} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          aria-label="Cancel"
          onClick={onCancel}
          className="text-muted hover:bg-ghost-hover flex size-11 items-center justify-center rounded-md"
        >
          <Icon name="x" size={15} />
        </button>
      </div>
      {error && (
        <p id={errorId} className="text-danger-fg m-0 max-w-[150px] text-xs">
          {error}
        </p>
      )}
    </form>
  )
}
