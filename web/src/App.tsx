import { CapacityGrid } from './CapacityGrid'
import {
  DEFAULT_RANGE,
  parseRange,
  rangeStartingAt,
  serializeRange,
  shiftRange,
  withFrom,
  withTo,
} from './range'
import { useSearchParamsState } from './useSearchParamsState'

const buttonClass =
  'rounded border border-gray-300 px-3 py-1 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800'

const inputClass = 'rounded border border-gray-300 px-2 py-1 dark:border-gray-700'

function today(): string {
  return new Date().toLocaleDateString('en-CA')
}

export function App() {
  const [range, setRange] = useSearchParamsState(parseRange, serializeRange, DEFAULT_RANGE)

  function changeFrom(value: string) {
    if (value) setRange((r) => withFrom(r, value))
  }

  function changeTo(value: string) {
    if (value) setRange((r) => withTo(r, value))
  }

  return (
    <main className="p-8">
      <h1 className="mb-4 text-2xl font-semibold">Team capacity</h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button className={buttonClass} onClick={() => setRange((r) => shiftRange(r, -1))} aria-label="Previous week">
          ←
        </button>
        <button className={buttonClass} onClick={() => setRange((r) => rangeStartingAt(r, today()))}>
          This week
        </button>
        <button className={buttonClass} onClick={() => setRange((r) => shiftRange(r, 1))} aria-label="Next week">
          →
        </button>

        <label className="ml-4 flex items-center gap-2">
          From
          <input type="date" value={range.from} onChange={(e) => changeFrom(e.target.value)} className={inputClass} />
        </label>
        <label className="flex items-center gap-2">
          To
          <input type="date" value={range.to} onChange={(e) => changeTo(e.target.value)} className={inputClass} />
        </label>
      </div>

      <CapacityGrid from={range.from} to={range.to} />
    </main>
  )
}
