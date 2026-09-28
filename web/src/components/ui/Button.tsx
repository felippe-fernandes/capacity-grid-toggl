import type { ComponentProps } from 'react'

type Variant = 'primary' | 'outline' | 'ghost' | 'danger'

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent',
  outline: 'border border-button-border bg-button-bg text-fg hover:bg-ghost-hover',
  ghost: 'text-muted hover:bg-ghost-hover',
  danger: 'border border-danger-border text-danger-fg',
}

type Props = ComponentProps<'button'> & { variant?: Variant }

export function Button({ variant = 'outline', className = '', ...props }: Props) {
  return (
    <button
      type="button"
      {...props}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${className}`}
    />
  )
}
