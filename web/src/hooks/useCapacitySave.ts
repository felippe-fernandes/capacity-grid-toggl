import type { PersonCapacity } from '../api/capacity'
import { currentFromConflict } from '../api/people'
import { describeSaveError } from '../lib/saveErrors'
import { useUpdateWeeklyHours } from './useUpdateWeeklyHours'

export type SaveFailure =
  { kind: 'failed'; from: number; to: number; message: string } | { kind: 'conflict'; theirs: number; mine: number }

export function useCapacitySave(person: PersonCapacity) {
  const mutation = useUpdateWeeklyHours(person.id)
  const { variables } = mutation

  const save = (hours: number) => mutation.mutate({ hours, expected: person.weeklyHours })

  let failure: SaveFailure | null = null
  if (mutation.isError && variables) {
    const current = currentFromConflict(mutation.error)
    failure = current
      ? { kind: 'conflict', theirs: current.weeklyHours, mine: variables.hours }
      : { kind: 'failed', from: variables.expected, to: variables.hours, message: describeSaveError(mutation.error) }
  }

  return {
    save,
    savingHours: mutation.isPending ? (variables?.hours ?? null) : null,
    failure,
    retry: () => {
      if (variables) save(variables.hours)
    },
    dismiss: mutation.reset,
  }
}
