import { useEffect, useState } from 'react'
import type { PersonCapacity } from '../api/capacity'
import { useUpdateWeeklyHours } from '../hooks/useUpdateWeeklyHours'

export function CapacityInput({ person }: { person: PersonCapacity }) {
  const [draft, setDraft] = useState(String(person.weeklyHours))
  const mutation = useUpdateWeeklyHours(person.id)

  useEffect(() => setDraft(String(person.weeklyHours)), [person.weeklyHours])

  function save() {
    const hours = Number(draft)
    if (draft.trim() === '' || Number.isNaN(hours) || hours === person.weeklyHours) {
      setDraft(String(person.weeklyHours))
      return
    }
    mutation.mutate(hours)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
      className="flex flex-col items-end gap-1"
    >
      <input
        type="number"
        step="any"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setDraft(String(person.weeklyHours))
        }}
        aria-label={`Weekly hours for ${person.name}`}
        className="w-16 rounded border border-gray-300 px-1 text-right dark:border-gray-700"
      />
      {mutation.isPending && <span className="text-xs text-gray-500">Saving…</span>}
      {mutation.isError && (
        <span role="alert" className="text-xs text-red-600">
          {mutation.error.message}
        </span>
      )}
    </form>
  )
}
