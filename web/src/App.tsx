import { useState } from 'react'
import { CapacityGrid } from './CapacityGrid'
import { addDays, daysBetween, mondayOf } from './capacity'

const MAX_DAYS = 26 * 7

const buttonClass =
  'rounded border border-gray-300 px-3 py-1 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800'

const inputClass = 'rounded border border-gray-300 px-2 py-1 dark:border-gray-700'

type Range = { from: string; to: string }

function sundayOf(iso: string): string {
  return addDays(mondayOf(iso), 6)
}

function today(): string {
  return new Date().toLocaleDateString('en-CA')
}

export function App() {
  const [range, setRange] = useState<Range>({ from: '2025-12-29', to: '2026-01-18' })

  function shiftWeeks(weeks: number) {
    setRange((r) => ({ from: addDays(r.from, weeks * 7), to: addDays(r.to, weeks * 7) }))
  }

  function goToThisWeek() {
    setRange((r) => {
      const from = mondayOf(today())
      return { from, to: addDays(from, daysBetween(r.from, r.to)) }
    })
  }

  function changeFrom(value: string) {
    if (!value) return
    setRange((r) => {
      const from = mondayOf(value)
      let to = r.to < from ? sundayOf(from) : r.to
      if (daysBetween(from, to) >= MAX_DAYS) to = addDays(from, MAX_DAYS - 1)
      return { from, to }
    })
  }

  function changeTo(value: string) {
    if (!value) return
    setRange((r) => {
      const to = sundayOf(value)
      let from = r.from > to ? mondayOf(to) : r.from
      if (daysBetween(from, to) >= MAX_DAYS) from = addDays(to, -(MAX_DAYS - 1))
      return { from, to }
    })
  }

  return (
    <main className="p-8">
      <h1 className="mb-4 text-2xl font-semibold">Team capacity</h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button className={buttonClass} onClick={() => shiftWeeks(-1)} aria-label="Previous week">
          ←
        </button>
        <button className={buttonClass} onClick={goToThisWeek}>
          This week
        </button>
        <button className={buttonClass} onClick={() => shiftWeeks(1)} aria-label="Next week">
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
