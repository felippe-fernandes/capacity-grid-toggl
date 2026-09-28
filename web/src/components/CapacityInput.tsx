import { useState } from 'react'
import type { PersonCapacity } from '../api/capacity'
import { useUpdateWeeklyHours } from '../hooks/useUpdateWeeklyHours'
import { describeSaveError } from '../lib/saveErrors'
import { parseWeeklyHours } from '../lib/weeklyHours'

export function CapacityInput({ person }: { person: PersonCapacity }) {
  const [draft, setDraft] = useState<string | null>(null)
  const [invalid, setInvalid] = useState<string | null>(null)
  const mutation = useUpdateWeeklyHours(person.id)

  const value = draft ?? String(person.weeklyHours)

  function save() {
    if (draft === null) return
    const parsed = parseWeeklyHours(draft)
    if (!parsed.ok) {
      setInvalid(parsed.message)
      return
    }
    setInvalid(null)
    if (parsed.hours === person.weeklyHours) {
      setDraft(null)
      mutation.reset()
      return
    }
    mutation.mutate(parsed.hours, { onSuccess: () => setDraft(null) })
  }

  function discard() {
    setDraft(null)
    setInvalid(null)
    mutation.reset()
  }

  const message = invalid ?? (mutation.isError ? describeSaveError(mutation.error) : null)

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
        step="1"
        value={value}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (!mutation.isError) save()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') discard()
        }}
        aria-label={`Weekly hours for ${person.name}`}
        aria-invalid={message ? true : undefined}
        className={`w-16 rounded border px-1 text-right ${message ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
      />
      {mutation.isPending && <span className="text-xs text-gray-500">Saving…</span>}
      {message && (
        <span role="alert" className="flex items-center gap-2 text-xs whitespace-nowrap text-red-600">
          {message}
          {mutation.isError && !invalid && (
            <button type="button" onClick={save} className="underline">
              Retry
            </button>
          )}
          <button type="button" onClick={discard} className="underline">
            Discard
          </button>
        </span>
      )}
    </form>
  )
}
