export function ProgressBar() {
  return (
    <div
      role="progressbar"
      aria-label="Loading"
      className="bg-accent/15 absolute inset-x-0 top-0 z-30 h-0.5 overflow-hidden"
    >
      <div className="animate-slide bg-accent h-0.5 w-2/5" />
    </div>
  )
}
