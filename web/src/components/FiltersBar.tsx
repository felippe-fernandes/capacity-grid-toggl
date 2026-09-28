import { CheckboxPill } from './ui/CheckboxPill'
import { SearchField } from './ui/SearchField'

type Props = {
  query: string
  overOnly: boolean
  onQueryChange: (query: string) => void
  onOverOnlyChange: (overOnly: boolean) => void
}

export function FiltersBar({ query, overOnly, onQueryChange, onOverOnlyChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <SearchField label="Search people" value={query} onChange={onQueryChange} />
      <CheckboxPill label="Only over-allocated" checked={overOnly} onChange={onOverOnlyChange} />
    </div>
  )
}
