import { useMemo, useState } from 'react'
import { getState, updateState, getIncomeForMonth } from '../store'
import { useTranslation } from '../LanguageContext'
import {
  formatCurrency,
  getPastMonthKeys,
  monthYearLabel,
  isMonthKey,
  getCurrentMonthKey,
} from '../utils'
import type { Transaction } from '../types'

const MONTHS_TO_SHOW = 24

export default function PastOverviews() {
  const { t } = useTranslation()
  const state = getState()
  const currency = state.currency
  const [editingIncome, setEditingIncome] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [expensesMonthKey, setExpensesMonthKey] = useState<string | null>(null)

  const monthKeys = useMemo(() => getPastMonthKeys(MONTHS_TO_SHOW), [])
  const currentMonthKey = getCurrentMonthKey()

  const rows = useMemo(() => {
    return monthKeys.map((monthKey) => {
      const expenses = state.transactions
        .filter((t) => t.type === 'expense' && isMonthKey(t.date, monthKey))
        .reduce((s, t) => s + t.amount, 0)
      const savings = state.transactions
        .filter((t) => t.type === 'saving' && isMonthKey(t.date, monthKey))
        .reduce((s, t) => s + t.amount, 0)
      const override = state.incomeByMonth?.[monthKey]
      const income =
        monthKey === currentMonthKey
          ? getIncomeForMonth(state, monthKey)
          : override ?? 0
      const left = income - expenses - savings
      return {
        monthKey,
        label: monthYearLabel(monthKey),
        income,
        expenses,
        savings,
        left,
      }
    })
  }, [state.transactions, state.monthlyIncome, state.incomeByMonth, monthKeys])

  const handleIncomeBlur = (monthKey: string) => {
    const num = parseFloat(editValue)
    updateState((s) => {
      const next = { ...(s.incomeByMonth ?? {}) }
      if (editValue.trim() === '' || Number.isNaN(num) || num < 0) {
        delete next[monthKey]
      } else {
        next[monthKey] = num
      }
      return { ...s, incomeByMonth: Object.keys(next).length ? next : undefined }
    })
    setEditingIncome(null)
  }

  const startEditIncome = (monthKey: string, current: number) => {
    setEditingIncome(monthKey)
    setEditValue(String(current))
  }

  const categoryNames = Object.fromEntries(state.categories.map((c) => [c.id, c.name]))
  const accountNames = Object.fromEntries(state.accounts.map((a) => [a.id, a.name]))
  const expensesForSelectedMonth = useMemo((): Transaction[] => {
    if (!expensesMonthKey) return []
    return state.transactions
      .filter((tx) => tx.type === 'expense' && isMonthKey(tx.date, expensesMonthKey))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [state.transactions, expensesMonthKey])

  return (
    <>
      <h1 style={{ marginTop: 0, marginBottom: '0.5rem' }}>{t('past.title')}</h1>
      <p className="muted" style={{ marginBottom: '1.5rem' }}>
        {t('past.subtitle')}
      </p>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 320 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem 0.75rem 0.5rem 0' }}>Month</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Income</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Expenses</th>
                <th style={{ padding: '0.5rem 0.75rem', textAlign: 'right' }}>Savings</th>
                <th style={{ padding: '0.5rem 0 0.5rem 0.75rem', textAlign: 'right' }}>Left</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.monthKey}
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <td style={{ padding: '0.6rem 0.75rem 0.6rem 0' }}>{row.label}</td>
                  <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>
                    {editingIncome === row.monthKey ? (
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleIncomeBlur(row.monthKey)}
                        onKeyDown={(e) => e.key === 'Enter' && handleIncomeBlur(row.monthKey)}
                        autoFocus
                        style={{ width: '5rem', padding: '0.25rem 0.4rem', textAlign: 'right' }}
                      />
                    ) : (
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() => startEditIncome(row.monthKey, row.income)}
                        style={{ padding: 0 }}
                        title="Edit income for this month"
                      >
                        {formatCurrency(row.income, currency)}
                      </button>
                    )}
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn-link amount-negative"
                      onClick={() => setExpensesMonthKey(row.monthKey)}
                      style={{ padding: 0, cursor: 'pointer' }}
                      title={t('past.expensesClickHint')}
                    >
                      {formatCurrency(row.expenses, currency)}
                    </button>
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }} className="amount-positive">
                    {formatCurrency(row.savings, currency)}
                  </td>
                  <td
                    style={{
                      padding: '0.6rem 0 0.6rem 0.75rem',
                      textAlign: 'right',
                      fontWeight: 600,
                      color: row.left >= 0 ? 'var(--success)' : 'var(--danger)',
                    }}
                  >
                    {formatCurrency(row.left, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {expensesMonthKey && (
        <div
          className="past-expenses-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`${t('past.expensesForMonthTitle')} ${monthYearLabel(expensesMonthKey)}`}
          onClick={() => setExpensesMonthKey(null)}
        >
          <div
            className="past-expenses-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>
                {t('past.expensesForMonthTitle')} {monthYearLabel(expensesMonthKey)}
              </h2>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setExpensesMonthKey(null)}
                aria-label={t('past.close')}
              >
                ×
              </button>
            </div>
            {expensesForSelectedMonth.length === 0 ? (
              <p className="muted">{t('past.noExpensesForMonth')}</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '60vh', overflowY: 'auto' }}>
                {expensesForSelectedMonth.map((tx) => (
                  <li
                    key={tx.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.35rem',
                      padding: '0.6rem 0',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ flex: '1 1 200px' }}>
                      <span>{tx.memo || (categoryNames[tx.categoryId ?? ''] ?? t('overview.uncategorized'))}</span>
                      <span className="muted" style={{ marginLeft: '0.5rem', fontSize: '0.9rem' }}>
                        {tx.date}
                        {accountNames[tx.accountId ?? ''] && ` · ${accountNames[tx.accountId!]}`}
                      </span>
                    </div>
                    <span className="amount-negative" style={{ fontWeight: 600 }}>
                      {formatCurrency(tx.amount, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  )
}
