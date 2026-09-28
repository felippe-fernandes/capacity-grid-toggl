import type { ReactNode } from 'react'

type Props = { matched: number; teamSize: number | undefined }

export function TableFooter({ matched, teamSize }: Props) {
  return (
    <div className="border-border bg-surface-total text-muted flex flex-wrap items-center justify-between gap-4 border-t px-5 py-3 text-[13px]">
      <p className="m-0">
        Showing {matched} of {teamSize ?? matched} people
      </p>
      <ul className="m-0 flex list-none flex-wrap items-center gap-4.5 p-0">
        <LegendItem swatch="bg-bar-under">Under</LegendItem>
        <LegendItem swatch="bg-accent">At capacity</LegendItem>
        <LegendItem swatch="bg-over">Over</LegendItem>
        <li className="flex items-center gap-2">
          <span className="text-dim font-mono">0 / 40</span>Nothing allocated
        </li>
      </ul>
    </div>
  )
}

function LegendItem({ swatch, children }: { swatch: string; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span aria-hidden="true" className={`h-1 w-4.5 rounded-sm ${swatch}`} />
      {children}
    </li>
  )
}
