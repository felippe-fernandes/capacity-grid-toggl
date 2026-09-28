import { useMemo } from 'react'
import { formatRangeLabel } from '../lib/dates'
import { defaultRange, parseRange, rangeStartingAt, serializeRange, shiftRange, withFrom, withTo } from '../lib/range'
import { useSearchParamsState } from './useSearchParamsState'

function today(): string {
  return new Date().toLocaleDateString('en-CA')
}

export function useDateRange() {
  const [range, setRange] = useSearchParamsState(parseRange, serializeRange, defaultRange(today()))

  const actions = useMemo(
    () => ({
      previousWeek: () => setRange((r) => shiftRange(r, -1)),
      nextWeek: () => setRange((r) => shiftRange(r, 1)),
      thisWeek: () => setRange((r) => rangeStartingAt(r, today())),
      setFrom: (value: string) => {
        if (value) setRange((r) => withFrom(r, value))
      },
      setTo: (value: string) => {
        if (value) setRange((r) => withTo(r, value))
      },
    }),
    [setRange],
  )

  return { range, label: formatRangeLabel(range.from, range.to), today: today(), ...actions }
}
