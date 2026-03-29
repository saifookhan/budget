import { describe, it, expect } from 'vitest'
import { formatCurrency, getPreviousMonthKey, isMonthKey } from './utils'

describe('formatCurrency', () => {
  it('formats EUR with grouping and euro sign', () => {
    const s = formatCurrency(1234.5, 'EUR')
    expect(s).toContain('234')
    expect(s).toMatch(/€/)
  })

  it('uses whole numbers for JPY', () => {
    expect(formatCurrency(5000, 'JPY')).toMatch(/5.?000/)
  })
})

describe('getPreviousMonthKey', () => {
  it('rolls year when month is January', () => {
    expect(getPreviousMonthKey('2026-01')).toBe('2025-12')
  })

  it('decrements month otherwise', () => {
    expect(getPreviousMonthKey('2026-03')).toBe('2026-02')
  })
})

describe('isMonthKey', () => {
  it('matches YYYY-MM prefix on full dates', () => {
    expect(isMonthKey('2026-04-12', '2026-04')).toBe(true)
    expect(isMonthKey('2026-04-12', '2026-05')).toBe(false)
  })
})
