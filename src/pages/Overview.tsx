import { useMemo, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getState, subscribe } from '../store'
import type { BudgetState } from '../types'
import { useTranslation } from '../LanguageContext'
import { getStoredTheme, getChartColorsForTheme } from '../theme'
import type { ThemeId } from '../theme'
import {
  formatCurrency,
  getCurrentMonthKey,
  getPreviousMonthKey,
  isMonthKey,
} from '../utils'

const CHART_TYPE_KEY = 'overview-chart-type'
const SHOW_MONEY_IN_WALLETS_KEY = 'overview-show-money-in-wallets'

export type OverviewChartType = 'pie' | 'bar' | 'line' | 'list'

function getStoredChartType(): OverviewChartType {
  try {
    const v = localStorage.getItem(CHART_TYPE_KEY) as OverviewChartType | null
    if (v === 'pie' || v === 'bar' || v === 'line' || v === 'list') return v
  } catch {}
  return 'pie'
}

function setStoredChartType(type: OverviewChartType): void {
  try {
    localStorage.setItem(CHART_TYPE_KEY, type)
  } catch {}
}

function getStoredShowMoneyInWallets(): boolean {
  try {
    return localStorage.getItem(SHOW_MONEY_IN_WALLETS_KEY) === '1'
  } catch {}
  return false
}

function setStoredShowMoneyInWallets(value: boolean): void {
  try {
    localStorage.setItem(SHOW_MONEY_IN_WALLETS_KEY, value ? '1' : '0')
  } catch {}
}

function useOverview() {
  const location = useLocation()
  const [state, setState] = useState<BudgetState>(() => getState())
  useEffect(() => {
    setState(getState())
  }, [location.pathname])
  useEffect(() => {
    return subscribe(() => setState(getState()))
  }, [])
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

    const subscriptions = state.recurring.filter((r) => r.type === 'subscription')
    const totalSubscriptionAmount = subscriptions.reduce((s, r) => s + r.amount, 0)
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
  // Money left after all subscriptions (all treated as cut for the month)
  const leftReal = left - totalSubscriptionAmount + appliedSubscriptionAmount

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
    leftReal,
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
  const { t } = useTranslation()
  const data = useOverview()
  const chartTheme = theme ?? getStoredTheme()
  const [chartType, setChartType] = useState<OverviewChartType>(getStoredChartType)
  const [showMoneyInWallets, setShowMoneyInWallets] = useState(getStoredShowMoneyInWallets)

  const handleChartTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as OverviewChartType
    setChartType(value)
    setStoredChartType(value)
  }

  const handleShowMoneyInWalletsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setShowMoneyInWallets(checked)
    setStoredShowMoneyInWallets(checked)
  }

  return (
    <>
      <h1 style={{ marginTop: 0, marginBottom: '0.5rem' }}>{t('overview.title')}</h1>
      <p className="muted" style={{ marginBottom: '1.5rem' }}>
        {t('overview.subtitle')}
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
                    {t('overview.starting')} {formatCurrency(start, data.currency)} · {t('overview.spent')} {formatCurrency(spent, data.currency)} · {t('overview.saved')} {formatCurrency(saved, data.currency)}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem' }}>
          <input
            type="checkbox"
            checked={showMoneyInWallets}
            onChange={handleShowMoneyInWalletsChange}
            aria-describedby="overview-show-money-in-wallets-desc"
          />
          <span id="overview-show-money-in-wallets-desc">{t('overview.showMoneyInWalletsOption')}</span>
        </label>
      </div>

      <div className="overview-three-boxes">
        <div className="card overview-box">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>{t('overview.availableThisMonth')}</h2>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
            {formatCurrency(data.availableThisMonth, data.currency)}
          </p>
          <p className="muted" style={{ marginTop: '0.5rem' }}>
            {t('overview.income')}: {formatCurrency(data.income, data.currency)}
            {data.carryOverFromLastMonth !== 0 && (
              <> · {t('overview.carryOver')}: {formatCurrency(data.carryOverFromLastMonth, data.currency)}</>
            )}
          </p>
          {data.income === 0 && (
            <p className="muted" style={{ marginTop: '0.5rem' }}>
              {t('overview.setIncomeHint')}
            </p>
          )}
        </div>

        <div className="card overview-box">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>{t('overview.moneyLeft')}</h2>
          <p
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              margin: 0,
              color: data.leftReal >= 0 ? 'var(--success)' : 'var(--danger)',
            }}
          >
            {formatCurrency(data.leftReal, data.currency)}
          </p>
          <p className="muted" style={{ marginTop: '0.5rem' }}>
            {t('overview.spent')}: {formatCurrency(data.totalExpenses, data.currency)} · {t('overview.saved')}: {formatCurrency(data.totalSavings, data.currency)}
            {data.totalSubscriptionAmount > 0 && (
              <> · {t('overview.subscriptionsThisMonth')}: {formatCurrency(data.totalSubscriptionAmount, data.currency)}</>
            )}
          </p>
        </div>

        {showMoneyInWallets && (
          <div className="card overview-box">
            <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>{t('overview.moneyInWallets')}</h2>
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
              {t('overview.moneyInWalletsHint')}
            </p>
          </div>
        )}
      </div>

      {Object.keys(data.byCategory).length > 0 && (() => {
        const chartColors = getChartColorsForTheme(chartTheme)
        const sorted = Object.entries(data.byCategory).sort((a, b) => b[1] - a[1])
        const total = sorted.reduce((s, [, amt]) => s + amt, 0)
        const maxAmount = Math.max(...sorted.map(([, amt]) => amt), 1)
        let acc = 0
        const segments = sorted.map(([catId, amount], i) => {
          const pct = total > 0 ? (amount / total) * 100 : 0
          const start = acc
          acc += pct
          return {
            catId,
            amount,
            pct,
            color: chartColors[i % chartColors.length],
            start: start.toFixed(2),
            end: acc.toFixed(2),
          }
        })
        const conic = total > 0
          ? segments.map((s) => `${s.color} ${s.start}% ${s.end}%`).join(', ')
          : 'var(--border) 0% 100%'

        const chartTypeOptions: { value: OverviewChartType; labelKey: string }[] = [
          { value: 'pie', labelKey: 'overview.chartPie' },
          { value: 'bar', labelKey: 'overview.chartBar' },
          { value: 'line', labelKey: 'overview.chartLine' },
          { value: 'list', labelKey: 'overview.chartList' },
        ]

        return (
          <div className="card">
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.1rem', flex: '1 1 auto' }}>{t('overview.spendingByCategory')}</h2>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.9rem' }}>
                <span className="muted">{t('overview.chartType')}</span>
                <select
                  value={chartType}
                  onChange={handleChartTypeChange}
                  aria-label={t('overview.chartType')}
                  style={{ padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
                >
                  {chartTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                  ))}
                </select>
              </label>
            </div>

            {chartType === 'pie' && (
              <div className="overview-category-chart">
                <div className="overview-category-chart-pie-wrap" aria-hidden>
                  <div
                    className="overview-category-chart-pie"
                    style={{ background: `conic-gradient(${conic})` }}
                  />
                  <div className="overview-category-chart-pie-hole" />
                </div>
                <ul className="overview-category-chart-legend" aria-label="Spending by category">
                  {segments.map(({ catId, amount, color }) => (
                    <li key={catId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span className="overview-category-chart-swatch" style={{ background: color }} aria-hidden />
                      <span>{data.categoryNames[catId] ?? t('overview.uncategorized')}</span>
                      <span className="amount-negative" style={{ marginLeft: 'auto' }}>{formatCurrency(amount, data.currency)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {chartType === 'bar' && (
              <div className="overview-bar-chart-wrapper">
                <div className="overview-bar-chart-area">
                  <div className="overview-bar-chart-bars">
                    {segments.map(({ catId, amount }) => {
                      const heightPct = maxAmount > 0 ? (amount / maxAmount) * 100 : 0
                      return (
                        <div
                          key={catId}
                          className="overview-bar-chart-bar-cell"
                          title={`${data.categoryNames[catId] ?? t('overview.uncategorized')}: ${formatCurrency(amount, data.currency)}`}
                        >
                          <div
                            className="overview-bar-chart-bar"
                            style={{ height: `${heightPct}%` }}
                            aria-hidden
                          />
                          <span className="overview-bar-chart-label">{data.categoryNames[catId] ?? t('overview.uncategorized')}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <ul className="overview-category-chart-legend" style={{ marginTop: '0.5rem' }} aria-label="Spending by category">
                  {segments.map(({ catId, amount, color }) => (
                    <li key={catId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span className="overview-category-chart-swatch" style={{ background: color }} aria-hidden />
                      <span>{data.categoryNames[catId] ?? t('overview.uncategorized')}</span>
                      <span className="amount-negative" style={{ marginLeft: 'auto' }}>{formatCurrency(amount, data.currency)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {chartType === 'line' && (() => {
              const w = 320
              const h = 140
              const pad = { top: 8, right: 8, bottom: 8, left: 8 }
              const innerW = w - pad.left - pad.right
              const innerH = h - pad.top - pad.bottom
              const n = segments.length
              const step = n > 1 ? innerW / (n - 1) : innerW
              const pts = segments.map(({ amount }, i) => {
                const x = pad.left + (n > 1 ? i * step : innerW / 2)
                const y = pad.top + innerH - (maxAmount > 0 ? (amount / maxAmount) * innerH : 0)
                return `${x},${y}`
              })
              const pathD = pts.length > 0 ? `M ${pts.join(' L ')}` : ''
              return (
                <div style={{ marginBottom: '0.5rem' }}>
                  <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} style={{ maxWidth: w, display: 'block' }} aria-hidden>
                    <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {segments.map(({ catId, amount, color }, i) => {
                      const x = pad.left + (n > 1 ? i * step : innerW / 2)
                      const y = pad.top + innerH - (maxAmount > 0 ? (amount / maxAmount) * innerH : 0)
                      return <circle key={catId} cx={x} cy={y} r={5} fill={color} /> 
                    })}
                  </svg>
                  <ul className="overview-category-chart-legend" style={{ marginTop: '0.5rem' }} aria-label="Spending by category">
                    {segments.map(({ catId, amount, color }) => (
                      <li key={catId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span className="overview-category-chart-swatch" style={{ background: color }} aria-hidden />
                        <span>{data.categoryNames[catId] ?? t('overview.uncategorized')}</span>
                        <span className="amount-negative" style={{ marginLeft: 'auto' }}>{formatCurrency(amount, data.currency)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })()}

            {chartType === 'list' && (
              <ul className="overview-category-chart-legend" style={{ marginBottom: 0 }} aria-label="Spending by category">
                {segments.map(({ catId, amount, color }) => (
                  <li key={catId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span className="overview-category-chart-swatch" style={{ background: color }} aria-hidden />
                    <span>{data.categoryNames[catId] ?? t('overview.uncategorized')}</span>
                    <span className="amount-negative" style={{ marginLeft: 'auto' }}>{formatCurrency(amount, data.currency)}</span>
                  </li>
                ))}
              </ul>
            )}

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
                  <span>{data.categoryNames[catId] ?? t('overview.uncategorized')}</span>
                  <span className="amount-negative">{formatCurrency(amount, data.currency)}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      })()}

      {Object.keys(data.byAccount).length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>{t('overview.byAccount')}</h2>
          <p className="muted" style={{ marginBottom: '0.75rem' }}>
            {t('overview.byAccountHint')}
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
                <strong>{data.accountNames[accId] ?? t('overview.noAccount')}</strong>
                <div className="muted" style={{ marginTop: '0.25rem' }}>
                  {t('nav.expenses')}: {formatCurrency(totals.expense, data.currency)} · {t('nav.savings')}: {formatCurrency(totals.saving, data.currency)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
