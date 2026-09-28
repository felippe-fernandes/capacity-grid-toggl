import type { SaveFailure } from '../../hooks/useCapacitySave'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'

type Props = {
  name: string
  failure: SaveFailure
  onRetry: () => void
  onDismiss: () => void
}

export function RowBanner({ name, failure, onRetry, onDismiss }: Props) {
  const first = name.split(' ')[0]

  return (
    <div role="alert" className="border-danger-border bg-danger-tint flex items-center gap-3.5 border-b px-5 py-2.5">
      <Icon name="alert" className="text-danger shrink-0" />
      {failure.kind === 'failed' ? (
        <>
          <p className="text-danger-fg m-0 flex-1 text-[13px]">
            Couldn't save {first}'s capacity ({failure.from}h to {failure.to}h). The grid is back to {failure.from}h.
            <span className="block text-xs opacity-80">{failure.message}</span>
          </p>
          <Button variant="danger" onClick={onRetry}>
            Retry {failure.to}h
          </Button>
          <Button variant="ghost" onClick={onDismiss}>
            Dismiss
          </Button>
        </>
      ) : (
        <>
          <p className="text-danger-fg m-0 flex-1 text-[13px]">
            Someone changed {first}'s capacity to {failure.theirs}h while you were editing.
          </p>
          <Button variant="danger" onClick={onDismiss}>
            Keep {failure.theirs}h
          </Button>
          <Button variant="ghost" onClick={onRetry}>
            Use {failure.mine}h
          </Button>
        </>
      )}
    </div>
  )
}
