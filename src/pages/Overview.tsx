import { useMemo } from 'react'
import { getState, getIncomeForMonth } from '../store'
import { getStoredTheme, getChartColorsForTheme } from '../theme'
import type { ThemeId } from '../theme'
import {
  formatCurrency,
  getCurrentMonthKey,
  getPreviousMonthKey,
  isMonthKey,
} from '../utils'

function useOverview() {
  const state = getState()
  const monthKey = getCurrentMonthKey()
  const prevMonthKey = getPreviousMonthKey(monthKey)

  const {
    totalExpenses,
    totalSavings,
    carryOverFromLastMonth,
    byCategory,
    byAccount,
    totalSubscriptionAmount,
    appliedSubscriptionAmount,
  } = useMemo(() => {
    const expenses = state.transactions.filter(
      (t) => t.type === 'expense' && isMonthKey(t.date, monthKey)
    )
    const savings = state.transactions.filter(
      (t) => t.type === 'saving' && isMonthKey(t.date, monthKey)
    )
    const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0)
    const totalSavings = savings.reduce((s, t) => s + t.amount, 0)

    const totalSubscriptionAmount = state.recurring
      .filter((r) => r.type === 'subscription')
      .reduce((s, r) => s + r.amount, 0)
    const appliedSubscriptionAmount = state.transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          t.recurringId &&
          isMonthKey(t.date, monthKey)
      )
      .reduce((s, t) => s + t.amount, 0)

    const prevExpenses = state.transactions
      .filter((t) => t.type === 'expense' && isMonthKey(t.date, prevMonthKey))
      .reduce((s, t) => s + t.amount, 0)
    const prevSavings = state.transactions
      .filter((t) => t.type === 'saving' && isMonthKey(t.date, prevMonthKey))
      .reduce((s, t) => s + t.amount, 0)
    const prevIncome = state.incomeByMonth?.[prevMonthKey] ?? 0
    const carryOverFromLastMonth = prevIncome - prevExpenses - prevSavings

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

    return {
      totalExpenses,
      totalSavings,
      carryOverFromLastMonth,
      byCategory,
      byAccount,
      totalSubscriptionAmount,
      appliedSubscriptionAmount,
    }
  }, [state.transactions, state.recurring, state.monthlyIncome, state.incomeByMonth, monthKey, prevMonthKey])

  const income = state.monthlyIncome
  const currency = state.currency
  const availableThisMonth = income + carryOverFromLastMonth
  const left = availableThisMonth - totalExpenses - totalSavings
  const subscriptionNotYetApplied = Math.max(
    0,
    totalSubscriptionAmount - appliedSubscriptionAmount
  )
  const leftAfterAllSubscriptions = left - subscriptionNotYetApplied

  const categoryNames = Object.fromEntries(
    state.categories.map((c) => [c.id, c.name])
  )
  const accountNames = Object.fromEntries(
    state.accounts.map((a) => [a.id, a.name])
  )

  // Per-account available = balance minus this month's expenses and savings from that account
  const accountAvailable = useMemo(() => {
    const out: Record<string, number> = {}
    state.accounts.forEach((a) => {
      const start = a.balance ?? 0
      const spent = byAccount[a.id]?.expense ?? 0
      const saved = byAccount[a.id]?.saving ?? 0
      out[a.id] = start - spent - saved
    })
    return out
  }, [state.accounts, byAccount])

  const totalInAccounts = state.accounts.reduce(
    (sum, a) => sum + (accountAvailable[a.id] ?? 0),
    0
  )

  return {
    currency,
    income,
    carryOverFromLastMonth,
    availableThisMonth,
    totalExpenses,
    totalSavings,
    left,
    leftAfterAllSubscriptions,
    totalSubscriptionAmount,
    totalInAccounts,
    byCategory,
    byAccount,
    accountAvailable,
    categoryNames,
    accountNames,
    categories: state.categories,
    accounts: state.accounts,
  }
}

type OverviewProps = { theme?: ThemeId }

export default function Overview({ theme }: OverviewProps) {
  const data = useOverview()
  const chartTheme = theme ?? getStoredTheme()

  return (
    <>
      <h1 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Overview</h1>
      <p className="muted" style={{ marginBottom: '1.5rem' }}>
        This month at a glance
      </p>

      {data.accounts.length > 0 && (
        <div className="overview-accounts-grid">
          {data.accounts.map((a) => {
            const available = data.accountAvailable[a.id] ?? 0
            const start = a.balance ?? 0
            const spent = data.byAccount[a.id]?.expense ?? 0
            const saved = data.byAccount[a.id]?.saving ?? 0
            return (
              <div key={a.id} className="card overview-box">
                <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>{a.name}</h2>
                {a.purpose && (
                  <p className="muted" style={{ marginTop: 0, marginBottom: '0.4rem' }}>
                    {a.purpose}
                  </p>
                )}
                <p
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    margin: 0,
                    color: available >= 0 ? 'var(--success)' : 'var(--danger)',
                  }}
                >
                  {a.balance != null ? formatCurrency(available, data.currency) : '—'}
                </p>
                {(spent > 0 || saved > 0 || start) && (
                  <p className="muted" style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                    Starting {formatCurrency(start, data.currency)} · Spent {formatCurrency(spent, data.currency)} · Saved {formatCurrency(saved, data.currency)}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="overview-three-boxes">
        <div className="card overview-box">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Available this month</h2>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            {formatCurrency(data.availableThisMonth, data.currency)}
          </p>
          <p className="muted" style={{ marginTop: '0.5rem' }}>
            Income: {formatCurrency(data.income, data.currency)}
            {data.carryOverFromLastMonth !== 0 && (
              <> · Carry-over: {formatCurrency(data.carryOverFromLastMonth, data.currency)}</>
            )}
          </p>
          {data.income === 0 && (
            <p className="muted" style={{ marginTop: '0.5rem' }}>
              Set your income in the Income page.
            </p>
          )}
        </div>

        <div className="card overview-box">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Money left this month</h2>
          <p
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              margin: 0,
              color: data.leftAfterAllSubscriptions >= 0 ? 'var(--success)' : 'var(--danger)',
            }}
          >
            {formatCurrency(data.leftAfterAllSubscriptions, data.currency)}
          </p>
          <p className="muted" style={{ marginTop: '0.5rem' }}>
            Spent: {formatCurrency(data.totalExpenses, data.currency)} · Saved: {formatCurrency(data.totalSavings, data.currency)}
            {data.totalSubscriptionAmount > 0 && (
              <> · Subscriptions (this month): {formatCurrency(data.totalSubscriptionAmount, data.currency)}</>
            )}
          </p>
        </div>

        <div className="card overview-box">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Money in wallets</h2>
          <p
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              margin: 0,
              color: data.totalInAccounts >= 0 ? 'var(--success)' : 'var(--danger)',
            }}
          >
            {formatCurrency(data.totalInAccounts, data.currency)}
          </p>
          <p className="muted" style={{ marginTop: '0.5rem' }}>
            Total available across all wallets (set in Wallet, minus this month&apos;s spending).
          </p>
        </div>
      </div>

      {Object.keys(data.byCategory).length > 0 && (() => {
        const chartColors = getChartColorsForTheme(chartTheme)
        const sorted = Object.entries(data.byCategory).sort((a, b) => b[1] - a[1])
        const total = sorted.reduce((s, [, amt]) => s + amt, 0)
        let acc = 0
        const segments = sorted.map(([catId, amount], i) => {
          const pct = total > 0 ? (amount / total) * 100 : 0
          const start = acc
          acc += pct
          return {
            catId,
            amount,
            color: chartColors[i % chartColors.length],
            start: start.toFixed(2),
            end: acc.toFixed(2),
          }
        })
        const conic = total > 0
          ? segments.map((s) => `${s.color} ${s.start}% ${s.end}%`).join(', ')
          : 'var(--border) 0% 100%'
        return (
          <div className="card">
            <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Spending by category</h2>
            <div className="overview-category-chart">
              <div
                className="overview-category-chart-pie"
                style={{ background: `conic-gradient(${conic})` }}
                aria-hidden
              />
              <ul className="overview-category-chart-legend" aria-label="Spending by category">
                {segments.map(({ catId, amount, color }) => (
                  <li key={catId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span
                      className="overview-category-chart-swatch"
                      style={{ background: color }}
                      aria-hidden
                    />
                    <span>{data.categoryNames[catId] ?? 'Uncategorized'}</span>
                    <span className="amount-negative" style={{ marginLeft: 'auto' }}>
                      {formatCurrency(amount, data.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              {sorted.map(([catId, amount]) => (
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
                  <span className="amount-negative">{formatCurrency(amount, data.currency)}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      })()}

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
                  Expenses: {formatCurrency(totals.expense, data.currency)} · Savings: {formatCurrency(totals.saving, data.currency)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
