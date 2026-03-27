import { useMemo, useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
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

const SHOW_MONEY_IN_WALLETS_KEY = 'overview-show-money-in-wallets'

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
  const [showMoneyInWallets, setShowMoneyInWallets] = useState(getStoredShowMoneyInWallets)

  const handleShowMoneyInWalletsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked
    setShowMoneyInWallets(checked)
    setStoredShowMoneyInWallets(checked)
  }

  return (
    <div className="overview-page">
      <h1 className="overview-page-title">{t('overview.title')}</h1>

      <section className="overview-section" aria-label={t('overview.sectionSummary')}>
        <div className="overview-option-row">
          <label className="overview-checkbox-label">
            <input
              type="checkbox"
              checked={showMoneyInWallets}
              onChange={handleShowMoneyInWalletsChange}
              aria-label={t('overview.showMoneyInWalletsOption')}
              aria-describedby="overview-show-money-in-wallets-desc"
            />
            <span id="overview-show-money-in-wallets-desc">{t('overview.showMoneyInWalletsOption')}</span>
          </label>
        </div>

        <div className="overview-three-boxes">
          <div className="card overview-box">
            <h3 className="overview-box-heading">{t('overview.availableThisMonth')}</h3>
            <p className="overview-box-figure">{formatCurrency(data.availableThisMonth, data.currency)}</p>
            <p className="muted overview-box-detail">
              {t('overview.income')}: {formatCurrency(data.income, data.currency)}
              {data.carryOverFromLastMonth !== 0 && (
                <> · {t('overview.carryOver')}: {formatCurrency(data.carryOverFromLastMonth, data.currency)}</>
              )}
            </p>
            {data.income === 0 && (
              <p className="overview-box-detail">
                <Link to="/accounts" className="overview-to-wallet-link muted">
                  {t('overview.setIncomeHint')}
                </Link>
              </p>
            )}
          </div>

          <div className="card overview-box">
            <h3 className="overview-box-heading">{t('overview.moneyLeft')}</h3>
            <p
              className="overview-box-figure"
              style={{ color: data.leftReal >= 0 ? 'var(--success)' : 'var(--danger)' }}
            >
              {formatCurrency(data.leftReal, data.currency)}
            </p>
            <p className="muted overview-box-detail">
              {t('overview.spent')}: {formatCurrency(data.totalExpenses, data.currency)} · {t('overview.saved')}:{' '}
              {formatCurrency(data.totalSavings, data.currency)}
              {data.totalSubscriptionAmount > 0 && (
                <>
                  {' '}
                  · {t('overview.subscriptionsThisMonth')}: {formatCurrency(data.totalSubscriptionAmount, data.currency)}
                </>
              )}
            </p>
          </div>

          {showMoneyInWallets && (
            <div className="card overview-box">
              <h3 className="overview-box-heading">{t('overview.moneyInWallets')}</h3>
              <p
                className="overview-box-figure"
                style={{ color: data.totalInAccounts >= 0 ? 'var(--success)' : 'var(--danger)' }}
              >
                {formatCurrency(data.totalInAccounts, data.currency)}
              </p>
            </div>
          )}
        </div>
      </section>

      {data.accounts.length > 0 && (
        <section className="overview-section" aria-labelledby="overview-section-wallets">
          <h2 id="overview-section-wallets" className="overview-section-title">
            {t('overview.sectionWallets')}
          </h2>
          <div className="overview-accounts-grid">
            {data.accounts.map((a) => {
              const available = data.accountAvailable[a.id] ?? 0
              const start = a.balance ?? 0
              const spent = data.byAccount[a.id]?.expense ?? 0
              const saved = data.byAccount[a.id]?.saving ?? 0
              return (
                <div key={a.id} className="card overview-box">
                  <h3 className="overview-box-heading overview-box-heading--wallet">{a.name}</h3>
                  {a.purpose && <p className="muted overview-wallet-purpose">{a.purpose}</p>}
                  <p
                    className="overview-box-figure overview-box-figure--wallet"
                    style={{ color: available >= 0 ? 'var(--success)' : 'var(--danger)' }}
                  >
                    {a.balance != null ? formatCurrency(available, data.currency) : '—'}
                  </p>
                  {(spent > 0 || saved > 0 || start > 0) && (
                    <p className="muted overview-wallet-breakdown">
                      {t('overview.starting')} {formatCurrency(start, data.currency)} · {t('overview.spent')}{' '}
                      {formatCurrency(spent, data.currency)} · {t('overview.saved')} {formatCurrency(saved, data.currency)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {Object.keys(data.byCategory).length === 0 ? (
        <section className="overview-section" aria-labelledby="overview-section-spending">
          <h2 id="overview-section-spending" className="overview-section-title">
            {t('overview.sectionSpending')}
          </h2>
          <div className="card">
            <h3 className="overview-box-heading">{t('overview.spendingByCategory')}</h3>
            <p className="muted" style={{ margin: 0 }}>
              {t('emptyStates.noSpendingYet')}
            </p>
            <p style={{ marginTop: '0.75rem', marginBottom: 0 }}>
              <Link to="/" className="btn btn-primary">
                {t('expenses.addButton')}
              </Link>
            </p>
          </div>
        </section>
      ) : Object.keys(data.byCategory).length > 0 && (() => {
        const TOP_N = 8
        const chartColors = getChartColorsForTheme(chartTheme)
        const sorted = Object.entries(data.byCategory).sort((a, b) => b[1] - a[1])
        const otherAmount = sorted.length > TOP_N ? sorted.slice(TOP_N).reduce((s, [, amt]) => s + amt, 0) : 0
        const reducedEntries: [string, number][] =
          sorted.length > TOP_N && otherAmount > 0
            ? [...sorted.slice(0, TOP_N), ['other', otherAmount]]
            : sorted
        const total = reducedEntries.reduce((s, [, amt]) => s + amt, 0)
        const twoPi = Math.PI * 2
        let angleAcc = 0
        const segments = reducedEntries.map(([catId, amount], i) => {
          const pct = total > 0 ? (amount / total) * 100 : 0
          const a0 = angleAcc
          const sliceAngle = total > 0 ? (amount / total) * twoPi : 0
          angleAcc += sliceAngle
          const a1 = angleAcc
          return {
            catId,
            amount,
            pct,
            color: chartColors[i % chartColors.length],
            a0,
            a1,
          }
        })

        const pieSize = 240
        const cx = pieSize / 2
        const cy = pieSize / 2
        const R = pieSize * 0.42
        const rInner = R * 0.52

        function donutPath(a0: number, a1: number): string {
          const x0 = cx + R * Math.sin(a0)
          const y0 = cy - R * Math.cos(a0)
          const x1 = cx + R * Math.sin(a1)
          const y1 = cy - R * Math.cos(a1)
          const x0i = cx + rInner * Math.sin(a0)
          const y0i = cy - rInner * Math.cos(a0)
          const x1i = cx + rInner * Math.sin(a1)
          const y1i = cy - rInner * Math.cos(a1)
          const large = a1 - a0 > Math.PI ? 1 : 0
          return `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} L ${x1i} ${y1i} A ${rInner} ${rInner} 0 ${large} 0 ${x0i} ${y0i} Z`
        }

        return (
          <section className="overview-section" aria-labelledby="overview-section-spending">
            <h2 id="overview-section-spending" className="overview-section-title">
              {t('overview.sectionSpending')}
            </h2>
            <div className="card overview-pie-card">
              <div
                className="overview-pie-chart-wrap"
                role="img"
                aria-label={[
                  t('overview.spendingByCategory'),
                  ...segments.map((s) => {
                    const name =
                      s.catId === 'other' ? t('overview.other') : (data.categoryNames[s.catId] ?? t('overview.uncategorized'))
                    return `${name}: ${formatCurrency(s.amount, data.currency)}`
                  }),
                ].join('. ')}
              >
                <svg
                  width={pieSize}
                  height={pieSize}
                  viewBox={`0 0 ${pieSize} ${pieSize}`}
                  className="overview-pie-svg"
                  aria-hidden
                >
                  {total <= 0 ? (
                    <circle cx={cx} cy={cy} r={(R + rInner) / 2} fill="var(--border)" opacity={0.35} />
                  ) : (
                    segments.map((s) => {
                      const name =
                        s.catId === 'other' ? t('overview.other') : (data.categoryNames[s.catId] ?? t('overview.uncategorized'))
                      const mid = (s.a0 + s.a1) / 2
                      const labelR = (R + rInner) / 2
                      const tx = cx + labelR * Math.sin(mid)
                      const ty = cy - labelR * Math.cos(mid)
                      const amtShort = formatCurrency(s.amount, data.currency)
                      const maxName = s.pct < 6 ? 6 : s.pct < 12 ? 10 : 14
                      const nameLine = name.length > maxName ? `${name.slice(0, maxName - 1)}…` : name
                      const showLabel = s.pct >= 4.5
                      const span = s.a1 - s.a0
                      const fullCircle = span >= twoPi - 1e-4

                      const labelEl =
                        showLabel || fullCircle ? (
                          <text
                            x={tx}
                            y={ty}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="overview-pie-slice-label"
                          >
                            <tspan x={tx} dy="-0.55em" className="overview-pie-slice-label-name">
                              {nameLine}
                            </tspan>
                            <tspan x={tx} dy="1.15em" className="overview-pie-slice-label-amount">
                              {amtShort}
                            </tspan>
                          </text>
                        ) : null

                      const titleEl = `${name}: ${amtShort}`

                      if (fullCircle) {
                        const half = s.a0 + Math.PI
                        return (
                          <g key={s.catId}>
                            <path d={donutPath(s.a0, half)} fill={s.color}>
                              <title>{titleEl}</title>
                            </path>
                            <path d={donutPath(half, s.a1)} fill={s.color}>
                              <title>{titleEl}</title>
                            </path>
                            {labelEl}
                          </g>
                        )
                      }

                      return (
                        <g key={s.catId}>
                          <path d={donutPath(s.a0, s.a1)} fill={s.color}>
                            <title>{titleEl}</title>
                          </path>
                          {labelEl}
                        </g>
                      )
                    })
                  )}
                </svg>
              </div>
            </div>
          </section>
        )
      })()}

      {Object.keys(data.byAccount).length > 0 && (
        <section className="overview-section" aria-labelledby="overview-section-by-wallet">
          <h2 id="overview-section-by-wallet" className="overview-section-title">
            {t('overview.byAccount')}
          </h2>
          <div className="card overview-by-wallet-card">
            <ul className="overview-by-wallet-list">
              {Object.entries(data.byAccount).map(([accId, totals]) => (
                <li key={accId} className="overview-by-wallet-row">
                  <strong>{data.accountNames[accId] ?? t('overview.noAccount')}</strong>
                  <div className="muted overview-by-wallet-detail">
                    {t('nav.expenses')}: {formatCurrency(totals.expense, data.currency)} · {t('nav.savings')}:{' '}
                    {formatCurrency(totals.saving, data.currency)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  )
}
