import type { ReactNode } from 'react'

type Props = { rangeLabel: string; children?: ReactNode }

export function PageHeader({ rangeLabel, children }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6">
      <div className="flex flex-col gap-1.5">
        <p className="text-muted text-[13px] font-medium tracking-[0.08em] uppercase">Team overview</p>
        <h1 className="text-[32px] leading-tight font-semibold tracking-[-0.01em]">Capacity</h1>
        <p className="text-muted text-sm">Allocated hours against weekly capacity, {rangeLabel}</p>
      </div>
      {children}
    </header>
  )
}
