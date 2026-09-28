import { useId } from 'react'
import { Icon } from './Icon'

type Props = { label: string; value: string; onChange: (value: string) => void }

export function SearchField({ label, value, onChange }: Props) {
  const id = useId()
  return (
    <div className="relative flex items-center">
      <Icon name="search" className="text-muted pointer-events-none absolute left-3" />
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="search"
        placeholder={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-border-strong bg-surface text-fg placeholder:text-muted h-11 w-60 rounded-lg border pr-3 pl-9 text-sm"
      />
    </div>
  )
}
