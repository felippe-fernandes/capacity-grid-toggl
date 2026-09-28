type Props = { label: string; checked: boolean; onChange: (checked: boolean) => void }

export function CheckboxPill({ label, checked, onChange }: Props) {
  return (
    <label className="border-border-strong bg-surface flex h-11 cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-over m-0 size-4"
      />
      {label}
    </label>
  )
}
