import { useState, useEffect, useMemo } from 'react'
import { getState, subscribe } from '../store'
import { useTranslation } from '../LanguageContext'
import { formatCurrency } from '../utils'
import { getStoredTheme, getChartColorsForTheme } from '../theme'

export default function AllExpenses() {
  const { t } = useTranslation()
  const [state, setState] = useState(() => getState())

  useEffect(() => {
    setState(getState())
  }, [])
  useEffect(() => {
    return subscribe(() => setState(getState()))
  }, [])

  const expenses = useMemo(
    () =>
      [...state.transactions]
        .filter((tx) => tx.type === 'expense')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [state.transactions]
  )

  const byCategory = useMemo(() => {
    const out: Record<string, number> = {}
    expenses.forEach((t) => {
      const key = t.categoryId ?? 'Uncategorized'
      out[key] = (out[key] ?? 0) + t.amount
    })
    return out
  }, [expenses])

  const categoryNames = Object.fromEntries(state.categories.map((c) => [c.id, c.name]))
  const accountNames = Object.fromEntries(state.accounts.map((a) => [a.id, a.name]))
  const chartColors = getChartColorsForTheme(getStoredTheme())

  const total = expenses.reduce((s, t) => s + t.amount, 0)
  const sortedCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1])
  const maxAmount = Math.max(...sortedCategories.map(([, amt]) => amt), 1)

  return (
    <div className="page-content">
      <h1 className="page-title">{t('expensesReport.title')}</h1>
      <p className="muted page-lead">{t('expensesReport.subtitle')}</p>

      {expenses.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 className="section-title">{t('expensesReport.byCategory')}</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 180, padding: '0.5rem 0', marginBottom: '0.75rem' }}>
            {sortedCategories.map(([catId, amount], i) => {
              const heightPct = (amount / maxAmount) * 100
              return (
                <div
                  key={catId}
                  title={`${categoryNames[catId] ?? t('overview.uncategorized')}: ${formatCurrency(amount, state.currency)}`}
                  style={{
                    flex: 1,
                    minWidth: 28,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: `${heightPct}%`,
                      minHeight: heightPct > 0 ? 8 : 0,
                      background: chartColors[i % chartColors.length],
                      borderRadius: '6px 6px 0 0',
                    }}
                    aria-hidden
                  />
                  <span style={{ fontSize: '0.7rem', textAlign: 'center', lineHeight: 1.1, maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {categoryNames[catId] ?? t('overview.uncategorized')}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>
            {t('expensesReport.total')}: <strong className="amount-negative">{formatCurrency(total, state.currency)}</strong>
          </p>
        </div>
      )}

      <div className="card">
        <h2 className="section-title">{t('expensesReport.allExpenses')}</h2>
        {expenses.length === 0 ? (
          <p className="muted">{t('expensesReport.noExpenses')}</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {expenses.map((tx) => (
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
                  <span>{tx.memo || categoryNames[tx.categoryId ?? ''] || t('overview.uncategorized')}</span>
                  <span className="muted" style={{ marginLeft: '0.5rem', fontSize: '0.9rem' }}>
                    {tx.date}
                    {accountNames[tx.accountId ?? ''] && ` · ${accountNames[tx.accountId!]}`}
                  </span>
                </div>
                <span className="amount-negative" style={{ fontWeight: 600 }}>
                  {formatCurrency(tx.amount, state.currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
