import type { BudgetState, RecurringItem, Transaction } from './types'

const STORAGE_KEY = 'budget-app-data'

const defaultState: BudgetState = {
  monthlyIncome: 0,
  accounts: [],
  categories: [],
  transactions: [],
  recurring: [],
  savingsGoals: [],
}

function loadState(): BudgetState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultState }
    const parsed = JSON.parse(raw) as BudgetState
    return {
      monthlyIncome: parsed.monthlyIncome ?? 0,
      accounts: parsed.accounts ?? [],
      categories: parsed.categories ?? [],
      transactions: parsed.transactions ?? [],
      recurring: parsed.recurring ?? [],
      savingsGoals: parsed.savingsGoals ?? [],
    }
  } catch {
    return { ...defaultState }
  }
}

function saveState(state: BudgetState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

// Ensure recurring items have been "applied" for the current month (and catch-up past months)
function ensureRecurringApplied(state: BudgetState): BudgetState {
  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth()
  const today = now.getDate()

  const applied = new Set<string>() // "recurringId:YYYY-MM"
  state.transactions.forEach((t) => {
    if (t.recurringId && t.date) {
      const [y, m] = t.date.split('-').map(Number)
      applied.add(`${t.recurringId}:${y}-${String(m).padStart(2, '0')}`)
    }
  })

  const newTransactions: Transaction[] = [...state.transactions]

  state.recurring.forEach((r) => {
    const start = new Date(thisYear, thisMonth, 1)
    // Apply for current month if we're on or past dayOfMonth
    if (today >= r.dayOfMonth) {
      const key = `${r.id}:${thisYear}-${String(thisMonth + 1).padStart(2, '0')}`
      if (!applied.has(key)) {
        const dateStr = `${thisYear}-${String(thisMonth + 1).padStart(2, '0')}-${String(r.dayOfMonth).padStart(2, '0')}`
        newTransactions.push({
          id: crypto.randomUUID(),
          type: r.type === 'saving' ? 'saving' : 'expense',
          amount: r.amount,
          categoryId: r.categoryId,
          accountId: r.accountId,
          date: dateStr,
          memo: r.label,
          recurringId: r.id,
        })
        applied.add(key)
      }
    }
  })

  return { ...state, transactions: newTransactions }
}

export function getState(): BudgetState {
  const state = loadState()
  const applied = ensureRecurringApplied(state)
  if (applied.transactions.length !== state.transactions.length) {
    saveState(applied)
  }
  return applied
}

export function setState(update: Partial<BudgetState>): BudgetState {
  const current = loadState()
  const next = ensureRecurringApplied({ ...current, ...update })
  saveState(next)
  return next
}

export function updateState(fn: (state: BudgetState) => BudgetState): BudgetState {
  const current = getState()
  const next = fn(current)
  saveState(next)
  return next
}

export function id(): string {
  return crypto.randomUUID()
}
