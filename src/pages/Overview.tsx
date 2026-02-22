import { useMemo } from 'react'
import { getState } from '../store'
import { formatCurrency, isCurrentMonth } from '../utils'

function useOverview() {
  const state = getState()

  const { totalExpenses, totalSavings, byCategory, byAccount } = useMemo(() => {
    const expenses = state.transactions.filter(
      (t) => t.type === 'expense' && isCurrentMonth(t.date)
    )
    const savings = state.transactions.filter(
      (t) => t.type === 'saving' && isCurrentMonth(t.date)
    )
    const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0)
    const totalSavings = savings.reduce((s, t) => s + t.amount, 0)

    const byCategory: Record<string, number> = {}
    expenses.forEach((t) => {
      const key = t.categoryId ?? 'Uncategorized'
      byCategory[key] = (byCategory[key] ?? 0) + t.amount
    })

    const byAccount: Record<string, { expense: number; saving: number }> = {}
    ;[...expenses, ...savings].forEach((t) => {
      const key = t.accountId ?? 'No account'
      if (!byAccount[key]) byAccount[key] = { expense: 0, saving: 0 }
      if (t.type === 'expense') byAccount[key].expense += t.amount
      else byAccount[key].saving += t.amount
    })

    return { totalExpenses, totalSavings, byCategory, byAccount }
  }, [state.transactions])

  const income = state.monthlyIncome
  const left = income - totalExpenses - totalSavings

  const categoryNames = Object.fromEntries(
    state.categories.map((c) => [c.id, c.name])
  )
  const accountNames = Object.fromEntries(
    state.accounts.map((a) => [a.id, a.name])
  )

  return {
    income,
    totalExpenses,
    totalSavings,
    left,
    byCategory,
    byAccount,
    categoryNames,
    accountNames,
    categories: state.categories,
    accounts: state.accounts,
  }
}

export default function Overview() {
  const data = useOverview()

  return (
    <>
      <h1 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Overview</h1>
      <p className="muted" style={{ marginBottom: '1.5rem' }}>
        This month at a glance
      </p>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Monthly income</h2>
        <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
          {formatCurrency(data.income)}
        </p>
        {data.income === 0 && (
          <p className="muted" style={{ marginTop: '0.5rem' }}>
            Set your income in the Income page.
          </p>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Money left this month</h2>
        <p
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            margin: 0,
            color: data.left >= 0 ? 'var(--success)' : 'var(--danger)',
          }}
        >
          {formatCurrency(data.left)}
        </p>
        <p className="muted" style={{ marginTop: '0.5rem' }}>
          Expenses: {formatCurrency(data.totalExpenses)} · Savings: {formatCurrency(data.totalSavings)}
        </p>
      </div>

      {Object.keys(data.byCategory).length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Spending by category</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {Object.entries(data.byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([catId, amount]) => (
                <li
                  key={catId}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.4rem 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <span>{data.categoryNames[catId] ?? 'Uncategorized'}</span>
                  <span className="amount-negative">{formatCurrency(amount)}</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {Object.keys(data.byAccount).length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>By account</h2>
          <p className="muted" style={{ marginBottom: '0.75rem' }}>
            Where your money goes (e.g. Revolut for groceries, bank for rent)
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {Object.entries(data.byAccount).map(([accId, totals]) => (
              <li
                key={accId}
                style={{
                  padding: '0.5rem 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <strong>{data.accountNames[accId] ?? 'No account'}</strong>
                <div className="muted" style={{ marginTop: '0.25rem' }}>
                  Expenses: {formatCurrency(totals.expense)} · Savings: {formatCurrency(totals.saving)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
