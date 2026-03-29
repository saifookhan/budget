import { useMemo, useState, useEffect, useCallback } from 'react'
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

const CATEGORY_VIEW_KEY = 'overview-category-chart-view'

function getStoredCategoryView(): 'pie' | 'bar' {
  try {
    const v = localStorage.getItem(CATEGORY_VIEW_KEY)
    if (v === 'pie' || v === 'bar') return v
  } catch {}
  return 'bar'
}

function setStoredCategoryView(v: 'pie' | 'bar') {
  try {
    localStorage.setItem(CATEGORY_VIEW_KEY, v)
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

    return {
      totalExpenses,
      totalSavings,
      carryOverFromLastMonth,
      byCategory,
      totalSubscriptionAmount,
      appliedSubscriptionAmount,
    }
  }, [state.transactions, state.recurring, state.incomeByMonth, monthKey, prevMonthKey])

  const income = state.monthlyIncome
  const currency = state.currency
  const availableThisMonth = income + carryOverFromLastMonth
  const left = availableThisMonth - totalExpenses - totalSavings
  const leftReal = left - totalSubscriptionAmount + appliedSubscriptionAmount

  const categoryNames = Object.fromEntries(
    state.categories.map((c) => [c.id, c.name])
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
    byCategory,
    categoryNames,
  }
}

const TOP_N = 8
const twoPi = Math.PI * 2

type PieSeg = {
  catId: string
  amount: number
  pct: number
  color: string
  a0: number
  a1: number
}

function buildCategoryPie(
  byCategory: Record<string, number>,
  chartColors: string[]
): { entries: [string, number][]; total: number; segments: PieSeg[] } | null {
  const keys = Object.keys(byCategory)
  if (keys.length === 0) return null

  const sorted = Object.entries(byCategory).sort((a, b) => b[1] - a[1])
  const otherAmount = sorted.length > TOP_N ? sorted.slice(TOP_N).reduce((s, [, amt]) => s + amt, 0) : 0
  const reducedEntries: [string, number][] =
    sorted.length > TOP_N && otherAmount > 0
      ? [...sorted.slice(0, TOP_N), ['other', otherAmount]]
      : sorted
  const total = reducedEntries.reduce((s, [, amt]) => s + amt, 0)
  if (total <= 0) return null

  let angleAcc = 0
  const segments: PieSeg[] = reducedEntries.map(([catId, amount], i) => {
    const pct = (amount / total) * 100
    const a0 = angleAcc
    const sliceAngle = (amount / total) * twoPi
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

  return { entries: reducedEntries, total, segments }
}

function donutPath(cx: number, cy: number, R: number, rInner: number, a0: number, a1: number): string {
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

type OverviewProps = { theme?: ThemeId }

export default function Overview({ theme }: OverviewProps) {
  const { t } = useTranslation()
  const data = useOverview()
  const chartTheme = theme ?? getStoredTheme()
  const chartColors = useMemo(() => getChartColorsForTheme(chartTheme), [chartTheme])
  const [categoryView, setCategoryView] = useState<'pie' | 'bar'>(getStoredCategoryView)

  const setCategoryChartView = useCallback((v: 'pie' | 'bar') => {
    setCategoryView(v)
    setStoredCategoryView(v)
  }, [])

  const flowScale = Math.max(data.availableThisMonth, data.totalExpenses + data.totalSavings, 0)
  const wSpent = flowScale > 0 ? (data.totalExpenses / flowScale) * 100 : 0
  const wSaved = flowScale > 0 ? (data.totalSavings / flowScale) * 100 : 0
  const wLeft = flowScale > 0 ? (Math.max(0, data.left) / flowScale) * 100 : 0
  const spentColor = chartColors[3] ?? '#8c1c5b'
  const savedColor = chartColors[0] ?? '#c9a96e'

  const monthFlowAria = [
    `${t('overview.spent')}: ${formatCurrency(data.totalExpenses, data.currency)}`,
    `${t('overview.saved')}: ${formatCurrency(data.totalSavings, data.currency)}`,
    `${t('overview.moneyLeft')}: ${formatCurrency(data.leftReal, data.currency)}`,
    `${t('overview.availableThisMonth')}: ${formatCurrency(data.availableThisMonth, data.currency)}`,
  ].join('. ')

  const categoryPie = useMemo(
    () => buildCategoryPie(data.byCategory, chartColors),
    [data.byCategory, chartColors]
  )

  const categoryMax = categoryPie ? Math.max(...categoryPie.entries.map(([, a]) => a), 1) : 1

  const pieSize = 240
  const cx = pieSize / 2
  const cy = pieSize / 2
  const R = pieSize * 0.42
  const rInner = R * 0.52

  return (
    <div className="overview-page">
      <h1 className="overview-page-title">{t('overview.title')}</h1>
      <p className="overview-page-lead muted" id="overview-intro">
        {t('overview.intro')}
      </p>

      {!categoryPie ? (
        <section className="overview-section" aria-labelledby="overview-intro">
          <div className="card">
            <p className="muted" style={{ margin: 0 }}>
              {t('emptyStates.noSpendingYet')}
            </p>
            <p style={{ marginTop: '0.75rem', marginBottom: 0 }}>
              <Link to="/expenses" className="btn btn-primary">
                {t('expenses.addButton')}
              </Link>
            </p>
          </div>
        </section>
      ) : (
        <section className="overview-section" aria-labelledby="overview-intro">
          <div className="overview-chart-toolbar" role="group" aria-label={t('overview.chartType')}>
            <span className="overview-chart-toolbar-label">{t('overview.chartType')}</span>
            <div className="overview-chart-toggle">
              <button
                type="button"
                aria-pressed={categoryView === 'pie'}
                onClick={() => setCategoryChartView('pie')}
              >
                {t('overview.chartPie')}
              </button>
              <button
                type="button"
                aria-pressed={categoryView === 'bar'}
                onClick={() => setCategoryChartView('bar')}
              >
                {t('overview.chartBar')}
              </button>
            </div>
          </div>

          <div className="card overview-pie-card">
            {categoryView === 'pie' ? (
              <div
                className="overview-pie-chart-wrap"
                role="img"
                aria-label={[
                  t('overview.spendingByCategory'),
                  ...categoryPie.segments.map((s) => {
                    const name =
                      s.catId === 'other'
                        ? t('overview.other')
                        : (data.categoryNames[s.catId] ?? t('overview.uncategorized'))
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
                  {categoryPie.segments.map((s) => {
                    const name =
                      s.catId === 'other'
                        ? t('overview.other')
                        : (data.categoryNames[s.catId] ?? t('overview.uncategorized'))
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
                          <path d={donutPath(cx, cy, R, rInner, s.a0, half)} fill={s.color}>
                            <title>{titleEl}</title>
                          </path>
                          <path d={donutPath(cx, cy, R, rInner, half, s.a1)} fill={s.color}>
                            <title>{titleEl}</title>
                          </path>
                          {labelEl}
                        </g>
                      )
                    }

                    return (
                      <g key={s.catId}>
                        <path d={donutPath(cx, cy, R, rInner, s.a0, s.a1)} fill={s.color}>
                          <title>{titleEl}</title>
                        </path>
                        {labelEl}
                      </g>
                    )
                  })}
                </svg>
              </div>
            ) : (
              <div
                className="overview-category-bars"
                role="list"
                aria-label={t('overview.spendingByCategory')}
              >
                {categoryPie.entries.map(([catId, amount], i) => {
                  const name =
                    catId === 'other'
                      ? t('overview.other')
                      : (data.categoryNames[catId] ?? t('overview.uncategorized'))
                  const pct = categoryMax > 0 ? (amount / categoryMax) * 100 : 0
                  const color = chartColors[i % chartColors.length]
                  return (
                    <div key={catId} className="overview-category-bar-row" role="listitem">
                      <p className="overview-category-bar-name" title={name}>
                        {name}
                      </p>
                      <p className="overview-category-bar-amount">{formatCurrency(amount, data.currency)}</p>
                      <div className="overview-category-bar-track" aria-hidden>
                        <div
                          className="overview-category-bar-fill"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="overview-section overview-section--month-flow" aria-label={t('overview.monthFlow')}>
        <div className="card overview-summary-flow-card">
          <p className="muted overview-flow-total">
            {t('overview.availableThisMonth')}:{' '}
            <strong style={{ color: 'var(--text)' }}>
              {formatCurrency(data.availableThisMonth, data.currency)}
            </strong>
            {data.carryOverFromLastMonth !== 0 && (
              <>
                {' '}
                · {t('overview.carryOver')}: {formatCurrency(data.carryOverFromLastMonth, data.currency)}
              </>
            )}
          </p>

          {flowScale > 0 ? (
            <div className="overview-stacked-track">
              <svg
                className="overview-stacked-svg"
                viewBox="0 0 100 20"
                preserveAspectRatio="none"
                role="img"
                aria-label={monthFlowAria}
              >
                <title>{monthFlowAria}</title>
                {wSpent > 0 && <rect x={0} y={0} width={wSpent} height={20} fill={spentColor} />}
                {wSaved > 0 && <rect x={wSpent} y={0} width={wSaved} height={20} fill={savedColor} />}
                {wLeft > 0 && (
                  <rect x={wSpent + wSaved} y={0} width={wLeft} height={20} fill="var(--success)" />
                )}
              </svg>
            </div>
          ) : (
            <p className="muted" style={{ margin: '0.5rem 0 0' }}>
              {data.income === 0 ? (
                <Link to="/accounts" className="overview-to-wallet-link">
                  {t('overview.setIncomeHint')}
                </Link>
              ) : (
                t('emptyStates.noSpendingYet')
              )}
            </p>
          )}

          <ul className="overview-flow-legend">
            <li className="overview-flow-legend-item">
              <div className="overview-flow-legend-top">
                <span className="overview-flow-swatch" style={{ background: spentColor }} aria-hidden />
                <span className="overview-flow-legend-label">{t('overview.spent')}</span>
              </div>
              <p className="overview-flow-legend-value">{formatCurrency(data.totalExpenses, data.currency)}</p>
            </li>
            <li className="overview-flow-legend-item">
              <div className="overview-flow-legend-top">
                <span className="overview-flow-swatch" style={{ background: savedColor }} aria-hidden />
                <span className="overview-flow-legend-label">{t('overview.saved')}</span>
              </div>
              <p className="overview-flow-legend-value">{formatCurrency(data.totalSavings, data.currency)}</p>
            </li>
            <li className="overview-flow-legend-item">
              <div className="overview-flow-legend-top">
                <span
                  className="overview-flow-swatch"
                  style={{ background: 'var(--success)' }}
                  aria-hidden
                />
                <span className="overview-flow-legend-label">{t('overview.moneyLeft')}</span>
              </div>
              <p
                className="overview-flow-legend-value"
                style={{ color: data.leftReal >= 0 ? 'var(--success)' : 'var(--danger)' }}
              >
                {formatCurrency(data.leftReal, data.currency)}
              </p>
              {data.totalSubscriptionAmount > 0 && (
                <span className="muted" style={{ fontSize: '0.78rem', fontWeight: 500 }}>
                  {t('overview.subscriptionsThisMonth')}:{' '}
                  {formatCurrency(data.totalSubscriptionAmount, data.currency)}
                </span>
              )}
            </li>
          </ul>
        </div>
      </section>
    </div>
  )
}
