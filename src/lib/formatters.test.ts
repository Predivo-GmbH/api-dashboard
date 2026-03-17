import { formatCurrency, formatNumber, formatDate, formatDateTime, formatRelativeTime, daysUntil, maskSecret } from './formatters'

describe('formatCurrency', () => {
  it('formats USD by default', () => {
    expect(formatCurrency(142.5)).toBe('$142.50')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('formats large amounts with commas', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })

  it('supports other currencies', () => {
    expect(formatCurrency(100, 'EUR')).toContain('100')
  })
})

describe('formatNumber', () => {
  it('formats integers with commas', () => {
    expect(formatNumber(12847)).toBe('12,847')
  })

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0')
  })
})

describe('formatDate', () => {
  it('formats ISO date string', () => {
    const result = formatDate('2026-03-15')
    expect(result).toContain('Mar')
    expect(result).toContain('15')
    expect(result).toContain('2026')
  })

  it('formats Date object', () => {
    const result = formatDate(new Date(2026, 0, 1))
    expect(result).toContain('Jan')
    expect(result).toContain('2026')
  })
})

describe('formatDateTime', () => {
  it('includes time component', () => {
    const result = formatDateTime('2026-03-15T14:30:00Z')
    expect(result).toContain('Mar')
    expect(result).toContain('15')
  })
})

describe('formatRelativeTime', () => {
  it('returns "just now" for recent timestamps', () => {
    const now = new Date()
    expect(formatRelativeTime(now)).toBe('just now')
  })

  it('returns minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000)
    expect(formatRelativeTime(fiveMinAgo)).toBe('5m ago')
  })

  it('returns hours ago', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
    expect(formatRelativeTime(threeHoursAgo)).toBe('3h ago')
  })

  it('returns days ago', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    expect(formatRelativeTime(twoDaysAgo)).toBe('2d ago')
  })

  it('falls back to formatted date for old timestamps', () => {
    const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const result = formatRelativeTime(oldDate)
    expect(result).not.toContain('ago')
  })
})

describe('daysUntil', () => {
  it('returns positive for future dates', () => {
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
    expect(daysUntil(future)).toBeGreaterThanOrEqual(9)
    expect(daysUntil(future)).toBeLessThanOrEqual(11)
  })

  it('returns negative for past dates', () => {
    const past = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    expect(daysUntil(past)).toBeLessThan(0)
  })
})

describe('maskSecret', () => {
  it('prepends mask to hint', () => {
    expect(maskSecret('4f8a')).toBe('****4f8a')
  })

  it('handles empty hint', () => {
    expect(maskSecret('')).toBe('****')
  })
})
