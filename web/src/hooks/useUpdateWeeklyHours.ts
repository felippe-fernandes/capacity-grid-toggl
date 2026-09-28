import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CapacityPage } from '../api/capacity'
import { capacityKeys } from '../api/keys'
import { updateWeeklyHours } from '../api/people'

function withWeeklyHours(page: CapacityPage, id: number, weeklyHours: number): CapacityPage {
  return { ...page, people: page.people.map((p) => (p.id === id ? { ...p, weeklyHours } : p)) }
}

export function useUpdateWeeklyHours(personId: number) {
  const queryClient = useQueryClient()
  const mutationKey = ['weeklyHours', personId]

  return useMutation({
    mutationKey,
    scope: { id: `weeklyHours-${personId}` },
    mutationFn: (hours: number) => updateWeeklyHours(personId, hours),
    onMutate: async (hours) => {
      await queryClient.cancelQueries({ queryKey: capacityKeys.lists() })
      const previous = queryClient.getQueriesData<CapacityPage>({ queryKey: capacityKeys.lists() })
      queryClient.setQueriesData<CapacityPage>({ queryKey: capacityKeys.lists() }, (page) =>
        page ? withWeeklyHours(page, personId, hours) : page,
      )
      return { previous }
    },
    onError: (_error, _hours, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSuccess: () => {
      if (queryClient.isMutating({ mutationKey }) === 1) {
        return queryClient.invalidateQueries({ queryKey: capacityKeys.all })
      }
    },
  })
}
