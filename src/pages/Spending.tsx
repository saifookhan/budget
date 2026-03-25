import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getState, updateState, subscribe, id } from '../store'
import { replaceLocalState } from '../budgetSync'
import { useTranslation } from '../LanguageContext'
import { useUndo } from '../UndoContext'
import { formatCurrency } from '../utils'
import type { LanguageCode, Transaction } from '../types'

const MONTH_LABEL_LOCALE: Record<LanguageCode, string> = {
  en: 'en-US',
  it: 'it-IT',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES',
}

function monthKeyFromDate(dateStr: string): string {
  return dateStr.length >= 7 ? dateStr.slice(0, 7) : dateStr
}

function formatExpenseMonthLabel(ym: string, lang: LanguageCode): string {
  const [y, m] = ym.split('-').map(Number)
  if (!Number.isFinite(y) || !Number.isFinite(m)) return ym
  const d = new Date(y, m - 1, 1)
  return d.toLocaleDateString(MONTH_LABEL_LOCALE[lang] ?? 'en-US', { month: 'long', year: 'numeric' })
}

export default function Expenses() {
  const { t, language } = useTranslation()
  const { showUndo } = useUndo()
  const location = useLocation()
  const navigate = useNavigate()
  const [state, setState] = useState(() => getState())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [memo, setMemo] = useState('')
  const GETTING_STARTED_KEY = 'budget-getting-started-dismissed'
  const [gettingStartedDismissed, setGettingStartedDismissed] = useState(() => {
    if (typeof localStorage === 'undefined') return false
    return localStorage.getItem(GETTING_STARTED_KEY) === '1'
  })

  useEffect(() => {
    setState(getState())
    setTransactions(getState().transactions.filter((tx) => tx.type === 'expense'))
  }, [])
  useEffect(() => {
    return subscribe(() => {
      const s = getState()
      setState(s)
      setTransactions(s.transactions.filter((tx) => tx.type === 'expense'))
    })
  }, [])

  useEffect(() => {
    if ((location.state as { focusAdd?: boolean })?.focusAdd) {
      navigate('.', { replace: true, state: {} })
      const form = document.getElementById('expenses-add-form')
      const input = document.getElementById('sp-amount') as HTMLInputElement | null
      form?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setTimeout(() => input?.focus(), 350)
    }
  }, [location.state, navigate])

  const startEdit = (tx: Transaction) => {
    setEditingId(tx.id)
    setAmount(String(tx.amount))
    setDate(tx.date)
    setCategoryId(tx.categoryId ?? '')
    setAccountId(tx.accountId ?? '')
    setMemo(tx.memo ?? '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setAmount('')
    setDate(new Date().toISOString().slice(0, 10))
    setCategoryId('')
    setAccountId('')
    setMemo('')
  }

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const num = Math.round(parseFloat(amount) * 100) / 100
    if (!(num > 0)) return
    const dateStr = date || new Date().toISOString().slice(0, 10)
    if (editingId) {
      const next = updateState((s) => ({
        ...s,
        transactions: s.transactions.map((tx) =>
          tx.id === editingId
            ? {
                ...tx,
                amount: num,
                categoryId: categoryId || undefined,
                accountId: accountId || undefined,
                date: dateStr,
                memo: memo.trim() || undefined,
              }
            : tx
        ),
      }))
      setState(next)
      setTransactions(next.transactions.filter((tx) => tx.type === 'expense'))
      cancelEdit()
    } else {
      const next = updateState((s) => ({
        ...s,
        transactions: [
          ...s.transactions,
          {
            id: id(),
            type: 'expense',
            amount: num,
            categoryId: categoryId || undefined,
            accountId: accountId || undefined,
            date: dateStr,
            memo: memo.trim() || undefined,
          },
        ],
      }))
      setState(next)
      setTransactions(next.transactions.filter((tx) => tx.type === 'expense'))
      setAmount('')
      setDate(new Date().toISOString().slice(0, 10))
      setMemo('')
    }
  }

  const remove = (txId: string) => {
    if (!confirm(t('expenses.deleteConfirm'))) return
    if (editingId === txId) cancelEdit()
    const snapshot = getState()
    const next = updateState((s) => {
      const deleted = s.transactions.find((t) => t.id === txId)
      const skippedRecurring = [...(s.skippedRecurring ?? [])]
      if (deleted?.recurringId && deleted?.date) {
        const [y, m] = deleted.date.split('-').map(Number)
        const key = `${deleted.recurringId}:${y}-${String(m).padStart(2, '0')}`
        if (!skippedRecurring.includes(key)) skippedRecurring.push(key)
      }
      return {
        ...s,
        transactions: s.transactions.filter((t) => t.id !== txId),
        skippedRecurring,
      }
    })
    setState(next)
    setTransactions(next.transactions.filter((t) => t.type === 'expense'))
    showUndo(() => replaceLocalState(snapshot))
  }

  const addCategoryInline = () => {
    const name = newCategoryName.trim()
    if (!name) return
    const newId = id()
    const next = updateState((s) => ({
      ...s,
      categories: [...s.categories, { id: newId, name }],
    }))
    setState(next)
    setTransactions(next.transactions.filter((tx) => tx.type === 'expense'))
    setCategoryId(newId)
    setNewCategoryName('')
    setShowAddCategory(false)
  }

  const categories = state.categories
  const accounts = state.accounts
  const categoryNames = Object.fromEntries(categories.map((c) => [c.id, c.name]))
  const accountNames = Object.fromEntries(accounts.map((a) => [a.id, a.name]))

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const sortedLimited = sorted.slice(0, 50)

  const expensesByMonth = sortedLimited.reduce<Map<string, Transaction[]>>((map, tx) => {
    const key = monthKeyFromDate(tx.date)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(tx)
    return map
  }, new Map())
  const monthKeys = [...expensesByMonth.keys()].sort((a, b) => b.localeCompare(a))

  const showGettingStarted = !gettingStartedDismissed && sorted.length === 0

  useEffect(() => {
    if (categories.length === 1 && !categoryId && !editingId) {
      setCategoryId(categories[0].id)
    }
  }, [categories.length, categories[0]?.id, categoryId, editingId])

  const dismissGettingStarted = () => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(GETTING_STARTED_KEY, '1')
    setGettingStartedDismissed(true)
  }

  const focusAddForm = () => {
    if (editingId) cancelEdit()
    const form = document.getElementById('expenses-add-form')
    const input = document.getElementById('sp-amount') as HTMLInputElement | null
    form?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => input?.focus(), 300)
  }

  return (
    <div className="page-content">
      <h1 className="page-title">{t('expenses.title')}</h1>
      <p className="muted page-lead">
        {t('expenses.subtitleShort')}
      </p>

      {showGettingStarted && (
        <div className="card getting-started-card">
          <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>{t('easy.gettingStartedTitle')}</h2>
          <ol style={{ margin: '0 0 0.75rem 1rem', padding: 0, lineHeight: 1.6 }}>
            <li style={{ marginBottom: '0.35rem' }}>
              {t('easy.step1')}{' '}
              <Link to="/accounts" className="btn-link">{t('easy.setIncome')}</Link>
            </li>
            <li style={{ marginBottom: '0.35rem' }}>
              {t('easy.step2')}{' '}
              <button type="button" className="btn-link" onClick={() => { setShowAddCategory(true); document.getElementById('sp-category')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}>
                {t('easy.addCategory')}
              </button>
            </li>
            <li>
              {t('easy.step3')}{' '}
              <button type="button" className="btn-link" onClick={focusAddForm}>
                {t('easy.focusForm')}
              </button>
            </li>
          </ol>
          <button type="button" className="btn btn-ghost" onClick={dismissGettingStarted}>
            {t('easy.dismiss')}
          </button>
        </div>
      )}

      <form id="expenses-add-form" onSubmit={save} className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>
          {editingId ? t('expenses.editExpense') : t('expenses.addExpense')}
        </h2>
        <div className="form-group">
          <label htmlFor="sp-amount">{t('expenses.amount')}</label>
          <input
            id="sp-amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t('expenses.amountPlaceholder')}
            required
            inputMode="decimal"
          />
          <p className="form-hint muted">{t('expenses.amountHint')}</p>
        </div>
        <div className="form-group">
          <label htmlFor="sp-date">{t('expenses.date')}</label>
          <input
            id="sp-date"
            type="date"
            value={date || new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="sp-category">{t('expenses.category')}</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-start' }}>
            <select
              id="sp-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{ flex: '1 1 200px', minWidth: 0 }}
            >
              <option value="">{t('common.select')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {categories.length === 0 && (
              <p className="muted" style={{ margin: 0, fontSize: '0.85rem', width: '100%' }}>{t('emptyStates.noCategoriesYet')}</p>
            )}
            {!showAddCategory ? (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => setShowAddCategory(true)}
              >
                + {t('expenses.addCategoryInline')}
              </button>
            ) : (
              <div
                style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategoryInline())}
              >
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={t('categories.namePlaceholder')}
                  autoFocus
                  style={{ width: '10rem', padding: '0.35rem 0.5rem' }}
                />
                <button type="button" className="btn btn-primary" onClick={addCategoryInline}>
                  {t('common.add')}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => { setShowAddCategory(false); setNewCategoryName('') }}>
                  {t('common.cancel')}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="sp-account">{t('expenses.account')}</label>
          <p className="form-hint muted" style={{ marginTop: 0, marginBottom: '0.35rem' }}>{t('expenses.accountHint')}</p>
          <select
            id="sp-account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">{t('common.select')}</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="sp-memo">{t('expenses.memo')}</label>
          <input
            id="sp-memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="e.g. Weekly shop"
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="submit" className="btn btn-primary">
            {editingId ? t('expenses.updateButton') : t('expenses.addButton')}
          </button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={cancelEdit}>
              {t('common.cancel')}
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>{t('expenses.recent')}</h2>
        {sorted.length === 0 ? (
          <div className="muted">
            <p style={{ marginTop: 0, marginBottom: '0.25rem' }}>{t('emptyStates.addFirstExpense')}</p>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>{t('emptyStates.addFirstExpenseHint')}</p>
          </div>
        ) : (
          <div className="expenses-by-month">
            {monthKeys.map((ym, monthIndex) => {
              const list = expensesByMonth.get(ym) ?? []
              const monthTotal = list.reduce((s, tx) => s + tx.amount, 0)
              return (
                <details key={ym} className="expenses-month-details" open={monthIndex === 0}>
                  <summary className="expenses-month-summary">
                    <span className="expenses-month-summary-inner">
                      <span className="expenses-month-chevron" aria-hidden>
                        ▸
                      </span>
                      <span className="expenses-month-summary-title">{formatExpenseMonthLabel(ym, language)}</span>
                    </span>
                    <span className="expenses-month-summary-meta muted">
                      {list.length} · {formatCurrency(monthTotal, state.currency)}
                    </span>
                  </summary>
                  <ul className="expenses-month-list">
                    {list.map((tx) => (
                      <li key={tx.id} className="expenses-month-row">
                        <div className="expenses-month-row-main">
                          <span>{tx.memo || categoryNames[tx.categoryId ?? ''] || t('expenses.rowFallbackLabel')}</span>
                          <span className="muted expenses-month-row-sub">
                            {tx.date}
                            {accountNames[tx.accountId ?? ''] ? ` · ${accountNames[tx.accountId!]}` : ''}
                          </span>
                        </div>
                        <span className="expenses-month-row-actions">
                          <span className="amount-negative">{formatCurrency(tx.amount, state.currency)}</span>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => startEdit(tx)}
                            aria-label={t('common.edit')}
                          >
                            {t('common.edit')}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => remove(tx.id)}
                            aria-label={t('common.remove')}
                          >
                            ✕
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              )
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        className="expenses-fab"
        onClick={focusAddForm}
        aria-label={t('expenses.addExpense')}
        title={t('expenses.addExpense')}
      >
        +
      </button>
    </div>
  )
}
