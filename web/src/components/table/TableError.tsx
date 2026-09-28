import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'

type Props = { rangeLabel: string; onRetry: () => void }

export function TableError({ rangeLabel, onRetry }: Props) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3.5 px-6 py-24 text-center">
      <Icon name="alert" size={28} className="text-danger" />
      <p className="m-0 text-[17px] font-semibold">Couldn't load capacity for {rangeLabel}</p>
      <p className="text-muted m-0 max-w-[420px] text-sm">
        The server didn't respond. Your filters and date range are kept. Try again, or pick a shorter range.
      </p>
      <Button onClick={onRetry}>Try again</Button>
    </div>
  )
}

export function RefreshBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="border-danger-border bg-danger-tint text-danger-fg flex items-center gap-3 border-b px-5 py-2 text-[13px]"
    >
      <Icon name="alert" className="text-danger shrink-0" />
      <span className="flex-1">Couldn't refresh, showing the last data we had.</span>
      <Button variant="ghost" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
