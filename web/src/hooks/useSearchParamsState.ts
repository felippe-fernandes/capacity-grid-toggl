import { useEffect, useState } from 'react'

export function useSearchParamsState<T>(
  parse: (params: URLSearchParams) => T | null,
  serialize: (value: T) => Record<string, string>,
  fallback: T,
) {
  const [value, setValue] = useState<T>(() => parse(new URLSearchParams(window.location.search)) ?? fallback)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    for (const [key, param] of Object.entries(serialize(value))) params.set(key, param)
    const search = `?${params}`
    if (search !== window.location.search) {
      window.history.replaceState(window.history.state, '', search)
    }
  }, [value, serialize])

  return [value, setValue] as const
}
