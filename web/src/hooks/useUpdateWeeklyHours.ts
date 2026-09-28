import { type InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CapacityPage } from '../api/capacity'
import { capacityKeys } from '../api/keys'
import { currentFromConflict, updateWeeklyHours } from '../api/people'
import { patchPersonInPages } from '../lib/capacity'

type Pages = InfiniteData<CapacityPage, string | undefined>

export type SaveVariables = { hours: number; expected: number }

export function useUpdateWeeklyHours(personId: number) {
  const queryClient = useQueryClient()
  const mutationKey = ['weeklyHours', personId]

  const setHoursEverywhere = (hours: number) =>
    queryClient.setQueriesData<Pages>({ queryKey: capacityKeys.lists() }, (data) =>
      data ? patchPersonInPages(data, personId, hours) : data,
    )

  return useMutation({
    mutationKey,
    scope: { id: `weeklyHours-${personId}` },
    mutationFn: ({ hours, expected }: SaveVariables) => updateWeeklyHours(personId, hours, expected),
    onMutate: async ({ hours }) => {
      await queryClient.cancelQueries({ queryKey: capacityKeys.lists() })
      const previous = queryClient.getQueriesData<Pages>({ queryKey: capacityKeys.lists() })
      setHoursEverywhere(hours)
      return { previous }
    },
    onError: (error, _variables, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data))
      const current = currentFromConflict(error)
      if (current) setHoursEverywhere(current.weeklyHours)
    },
    onSuccess: () => {
      if (queryClient.isMutating({ mutationKey }) === 1) {
        return queryClient.invalidateQueries({ queryKey: capacityKeys.all })
      }
    },
  })
}
