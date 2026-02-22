export interface Account {
  id: string
  name: string
  purpose?: string
}

export interface Category {
  id: string
  name: string
}

export type TransactionType = 'expense' | 'income' | 'saving'

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  categoryId?: string
  accountId?: string
  date: string // YYYY-MM-DD
  memo?: string
  recurringId?: string
}

export interface RecurringItem {
  id: string
  label: string
  amount: number
  categoryId?: string
  accountId?: string
  dayOfMonth: number // 1-28 for safety
  type: 'subscription' | 'saving'
}

export interface SavingsGoal {
  id: string
  name: string
  monthlyAmount: number
  startDate: string // YYYY-MM-DD
  accountId?: string
  recurringId?: string // links to RecurringItem that auto-adds each month
}

export interface BudgetState {
  monthlyIncome: number
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  recurring: RecurringItem[]
  savingsGoals: SavingsGoal[]
}
