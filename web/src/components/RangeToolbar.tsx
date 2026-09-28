import { DateField } from './ui/DateField'
import { Icon } from './ui/Icon'

type Props = {
  from: string
  to: string
  onPrevious: () => void
  onNext: () => void
  onThisWeek: () => void
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
}

const segment = 'flex h-11 items-center justify-center hover:bg-ghost-hover'

export function RangeToolbar({ from, to, onPrevious, onNext, onThisWeek, onFromChange, onToChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="border-border-strong bg-surface flex items-center overflow-hidden rounded-lg border">
        <button type="button" aria-label="Previous week" onClick={onPrevious} className={`${segment} w-11`}>
          <Icon name="chevronLeft" />
        </button>
        <button
          type="button"
          onClick={onThisWeek}
          className={`${segment} border-border-strong border-x px-4 text-sm font-medium`}
        >
          This week
        </button>
        <button type="button" aria-label="Next week" onClick={onNext} className={`${segment} w-11`}>
          <Icon name="chevronRight" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <DateField label="From" value={from} onChange={onFromChange} />
        <DateField label="to" value={to} onChange={onToChange} />
      </div>
    </div>
  )
}
