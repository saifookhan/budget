import type { BudgetState, Transaction } from './types'

const STORAGE_KEY = 'budget-app-data'

const defaultState: BudgetState = {
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
}

function loadState(): BudgetState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultState }
    const parsed = JSON.parse(raw) as BudgetState
    return {
      monthlyIncome: parsed.monthlyIncome ?? 0,
      incomeByMonth: parsed.incomeByMonth ?? {},
      currency: parsed.currency ?? 'EUR',
      language: parsed.language ?? 'en',
      accounts: parsed.accounts ?? [],
      categories: parsed.categories ?? [],
      transactions: parsed.transactions ?? [],
      recurring: parsed.recurring ?? [],
      savingsGoals: parsed.savingsGoals ?? [],
      skippedRecurring: parsed.skippedRecurring ?? [],
    }
  } catch {
    return { ...defaultState }
  }
}

const listeners: Array<() => void> = []
const onSaveCallbacks: Array<() => void> = []

function saveState(state: BudgetState, opts?: { silent?: boolean }): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  listeners.forEach((l) => l())
  if (!opts?.silent) onSaveCallbacks.forEach((cb) => cb())
}

/** Subscribe to "saved" events (user-triggered saves). Use for e.g. a "Saved" banner. */
export function subscribeToSave(cb: () => void): () => void {
  onSaveCallbacks.push(cb)
  return () => {
    const i = onSaveCallbacks.indexOf(cb)
    if (i !== -1) onSaveCallbacks.splice(i, 1)
  }
}

/** Subscribe to store updates (e.g. after add/delete). Returns unsubscribe. */
export function subscribe(fn: () => void): () => void {
  listeners.push(fn)
  return () => {
    const i = listeners.indexOf(fn)
    if (i !== -1) listeners.splice(i, 1)
  }
}

// Ensure recurring items have been "applied" for the current month (and catch-up past months).
// Does not re-add recurring applications the user has deleted (skippedRecurring).
function ensureRecurringApplied(state: BudgetState): BudgetState {
  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth()
  const today = now.getDate()
  const skipped = new Set(state.skippedRecurring ?? [])

  const applied = new Set<string>() // "recurringId:YYYY-MM"
  state.transactions.forEach((t) => {
    if (t.recurringId && t.date) {
      const [y, m] = t.date.split('-').map(Number)
      applied.add(`${t.recurringId}:${y}-${String(m).padStart(2, '0')}`)
    }
  })

  const newTransactions: Transaction[] = [...state.transactions]

  state.recurring.forEach((r) => {
    const lastDayOfMonth = new Date(thisYear, thisMonth + 1, 0).getDate()
    const day = Math.min(r.dayOfMonth, lastDayOfMonth) // e.g. day 31 in Feb → 28
    if (today >= day) {
      const key = `${r.id}:${thisYear}-${String(thisMonth + 1).padStart(2, '0')}`
      if (!applied.has(key) && !skipped.has(key)) {
        const dateStr = `${thisYear}-${String(thisMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
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
    saveState(applied, { silent: true })
  }
  return applied
}

export function setState(update: Partial<BudgetState>): BudgetState {
  const current = loadState()
  const next = ensureRecurringApplied({ ...current, ...update })
  saveState(next)
  return next
}

export function updateState(fn: (state: BudgetState) => BudgetState, opts?: { silent?: boolean }): BudgetState {
  const current = getState()
  const next = fn(current)
  const normalized = ensureRecurringApplied(next)
  saveState(normalized, opts)
  return normalized
}

export function id(): string {
  return crypto.randomUUID()
}

/** Income for a given month (YYYY-MM). Uses incomeByMonth if set, else monthlyIncome. */
export function getIncomeForMonth(state: BudgetState, monthKey: string): number {
  const override = state.incomeByMonth?.[monthKey]
  return override !== undefined && override !== null ? override : state.monthlyIncome
}
