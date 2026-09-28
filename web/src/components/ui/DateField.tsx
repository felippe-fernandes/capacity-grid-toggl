import { useId } from 'react'

type Props = { label: string; value: string; onChange: (value: string) => void }

export function DateField({ label, value, onChange }: Props) {
  const id = useId()
  return (
    <>
      <label htmlFor={id} className="text-muted text-[13px]">
        {label}
      </label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-border-strong bg-surface text-fg h-11 rounded-lg border px-2.5 text-sm"
      />
    </>
  )
}
