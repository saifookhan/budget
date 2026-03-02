export interface Account {
  id: string
  name: string
  purpose?: string
  /** Money available in this account (user-set) */
  balance?: number
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
  dayOfMonth: number // 1-31
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

export type CurrencyCode =
  | 'EUR'
  | 'USD'
  | 'GBP'
  | 'CHF'
  | 'PLN'
  | 'SEK'
  | 'NOK'
  | 'DKK'
  | 'JPY'
  | 'CAD'
  | 'AUD'

export type LanguageCode = 'en' | 'it' | 'de' | 'fr' | 'es'

export interface BudgetState {
  monthlyIncome: number
  /** Income for specific months (YYYY-MM). Falls back to monthlyIncome if not set. */
  incomeByMonth?: Record<string, number>
  currency: CurrencyCode
  language: LanguageCode
  accounts: Account[]
  categories: Category[]
  transactions: Transaction[]
  recurring: RecurringItem[]
  savingsGoals: SavingsGoal[]
}
