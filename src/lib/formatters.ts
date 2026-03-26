export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const target = new Date(date)
  const diffMs = now.getTime() - target.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

export function daysUntil(date: string | Date): number {
  const now = new Date()
  const target = new Date(date)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function maskSecret(hint: string): string {
  return `****${hint}`
}

export function formatRemaining(remaining: number, unit: string): string {
  const cleanUnit = unit.replace(/\/month|\/day/g, '').trim()
  return `${formatNumber(remaining)} ${cleanUnit} left`
}

export function daysUntilEndOfMonth(): number {
  const now = new Date()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return Math.max(1, Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
}

export function estimateRunOut(
  used: number,
  limit: number,
  periodStartDate: string,
): string | null {
  if (used <= 0 || limit <= 0) return null
  const now = new Date()
  const periodStart = new Date(periodStartDate)
  const daysElapsed = Math.max(1, Math.ceil((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)))
  const dailyRate = used / daysElapsed
  if (dailyRate <= 0) return null

  const remaining = limit - used
  const daysUntilExhausted = remaining / dailyRate
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const daysLeft = Math.ceil((endOfMonth.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysUntilExhausted > daysLeft) return null // on track

  const runOutDate = new Date(now.getTime() + daysUntilExhausted * 24 * 60 * 60 * 1000)
  return `May run out ~${formatDate(runOutDate)}`
}

export function estimateDaysLeft(
  used: number,
  remaining: number,
): number | null {
  if (remaining <= 0) return 0
  if (used <= 0) return null
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const daysElapsed = Math.max(1, Math.ceil((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)))
  const dailyRate = used / daysElapsed
  if (dailyRate <= 0) return null
  return Math.round(remaining / dailyRate)
}
