import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { BudgetState } from './types'
import { getState, getIncomeForMonth } from './store'

const STORAGE_KEY = 'budget-app-data'

function emptyState(over: Partial<BudgetState> = {}): BudgetState {
  return {
    monthlyIncome: 0,
    incomeByMonth: {},
    currency: 'EUR',
    language: 'en',
    accounts: [],
    categories: [],
    transactions: [],
    recurring: [],
    savingsGoals: [],
    skippedRecurring: [],
    ...over,
  }
}

function seed(over: Partial<BudgetState>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyState(over)))
}

describe('getIncomeForMonth', () => {
  const state = emptyState({ monthlyIncome: 2000, incomeByMonth: { '2026-01': 1750 } })

  it('uses incomeByMonth when set for that month', () => {
    expect(getIncomeForMonth(state, '2026-01')).toBe(1750)
  })

  it('falls back to monthlyIncome when month not in incomeByMonth', () => {
    expect(getIncomeForMonth(state, '2026-02')).toBe(2000)
  })
})

describe('ensureRecurringApplied (via getState)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-4000-8000-000000000001')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('adds subscription as expense when billing day has passed this month', () => {
    vi.setSystemTime(new Date(2026, 2, 15, 12, 0, 0))
    seed({
      recurring: [
        {
          id: 'sub-1',
          label: 'Stream',
          amount: 14.99,
          dayOfMonth: 10,
          type: 'subscription',
          categoryId: 'c1',
        },
      ],
      transactions: [],
    })

    const s = getState()
    expect(s.transactions).toHaveLength(1)
    const tx = s.transactions[0]
    expect(tx.type).toBe('expense')
    expect(tx.recurringId).toBe('sub-1')
    expect(tx.amount).toBe(14.99)
    expect(tx.date).toBe('2026-03-10')
    expect(tx.memo).toBe('Stream')
  })

  it('does not re-add when skippedRecurring contains the month key', () => {
    vi.setSystemTime(new Date(2026, 2, 20, 12, 0, 0))
    seed({
      recurring: [
        {
          id: 'sub-1',
          label: 'Stream',
          amount: 10,
          dayOfMonth: 5,
          type: 'subscription',
        },
      ],
      transactions: [],
      skippedRecurring: ['sub-1:2026-03'],
    })

    const s = getState()
    expect(s.transactions.filter((t) => t.recurringId === 'sub-1')).toHaveLength(0)
  })

  it('uses last day of month when dayOfMonth exceeds month length', () => {
    vi.setSystemTime(new Date(2026, 1, 28, 12, 0, 0))
    seed({
      recurring: [
        {
          id: 'sub-feb',
          label: 'Rent',
          amount: 800,
          dayOfMonth: 31,
          type: 'subscription',
        },
      ],
      transactions: [],
    })

    const s = getState()
    const tx = s.transactions.find((t) => t.recurringId === 'sub-feb')
    expect(tx?.date).toBe('2026-02-28')
  })

  it('adds saving recurring as saving transaction', () => {
    vi.setSystemTime(new Date(2026, 2, 10, 12, 0, 0))
    seed({
      recurring: [
        {
          id: 'goal-r',
          label: 'Emergency',
          amount: 100,
          dayOfMonth: 1,
          type: 'saving',
        },
      ],
      transactions: [],
    })

    const s = getState()
    const tx = s.transactions.find((t) => t.recurringId === 'goal-r')
    expect(tx?.type).toBe('saving')
    expect(tx?.amount).toBe(100)
  })
})
