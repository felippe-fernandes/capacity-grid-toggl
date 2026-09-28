type Props = { name: string; overNote: string | null }

export function NameCell({ name, overNote }: Props) {
  return (
    <th scope="row" className="bg-surface sticky left-0 z-[1] px-5 py-2 text-left font-normal">
      <div className="max-w-[220px] truncate text-sm font-medium" title={name}>
        {name}
      </div>
      {overNote && <div className="text-over-fg text-xs">{overNote}</div>}
    </th>
  )
}
