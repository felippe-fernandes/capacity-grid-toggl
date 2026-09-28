import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateWeeklyHours, type CapacityData } from '../api/capacity'

function withWeeklyHours(data: CapacityData, id: number, weeklyHours: number): CapacityData {
  return { ...data, people: data.people.map((p) => (p.id === id ? { ...p, weeklyHours } : p)) }
}

export function useUpdateWeeklyHours(personId: number) {
  const queryClient = useQueryClient()
  const mutationKey = ['weeklyHours', personId]

  return useMutation({
    mutationKey,
    scope: { id: `weeklyHours-${personId}` },
    mutationFn: (hours: number) => updateWeeklyHours(personId, hours),
    onMutate: async (hours) => {
      await queryClient.cancelQueries({ queryKey: ['capacity'] })
      const previous = queryClient.getQueriesData<CapacityData>({ queryKey: ['capacity'] })
      queryClient.setQueriesData<CapacityData>({ queryKey: ['capacity'] }, (data) =>
        data ? withWeeklyHours(data, personId, hours) : data,
      )
      return { previous }
    },
    onError: (_error, _hours, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSuccess: () => {
      if (queryClient.isMutating({ mutationKey }) === 1) {
        return queryClient.invalidateQueries({ queryKey: ['capacity'] })
      }
    },
  })
}
