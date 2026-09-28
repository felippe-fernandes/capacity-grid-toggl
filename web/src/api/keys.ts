import type { CapacityQuery } from './capacity'

export const capacityKeys = {
  all: ['capacity'] as const,
  lists: () => [...capacityKeys.all, 'list'] as const,
  list: (query: CapacityQuery) => [...capacityKeys.lists(), query] as const,
  summary: (from: string, to: string) => [...capacityKeys.all, 'summary', { from, to }] as const,
}
