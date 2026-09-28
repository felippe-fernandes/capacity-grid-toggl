export type Status = 'free' | 'ok' | 'full' | 'over'

export function status(allocated: number, capacity: number): Status {
  if (allocated > capacity) return 'over'
  if (allocated === 0) return 'free'
  if (allocated === capacity) return 'full'
  return 'ok'
}
