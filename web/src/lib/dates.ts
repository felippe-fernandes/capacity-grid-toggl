const DAY_MS = 24 * 60 * 60 * 1000

function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`)
}

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addDays(iso: string, days: number): string {
  return toISO(new Date(toDate(iso).getTime() + days * DAY_MS))
}

export function mondayOf(iso: string): string {
  const weekday = toDate(iso).getUTCDay()
  return addDays(iso, -((weekday + 6) % 7))
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / DAY_MS)
}

const weekLabel = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', timeZone: 'UTC' })

export function formatWeek(iso: string): string {
  return weekLabel.format(toDate(iso))
}
