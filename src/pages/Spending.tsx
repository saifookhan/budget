import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getState, updateState, subscribe, id } from '../store'
import { replaceLocalState } from '../budgetSync'
import { useTranslation } from '../LanguageContext'
import { useUndo } from '../UndoContext'
import { formatCurrency } from '../utils'
import type { Transaction } from '../types'

export default function Expenses() {
  const { t } = useTranslation()
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

  const focusAddForm = () => {
    if (editingId) cancelEdit()
    const form = document.getElementById('expenses-add-form')
    const input = document.getElementById('sp-amount') as HTMLInputElement | null
    form?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => input?.focus(), 300)
  }

  return (
    <>
      <h1 style={{ marginTop: 0, marginBottom: '0.5rem' }}>{t('expenses.title')}</h1>
      <p className="muted" style={{ marginBottom: '1.5rem' }}>
        {t('expenses.subtitle')}
      </p>

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
          />
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
          <p className="muted">{t('expenses.noExpenses')}</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {sorted.slice(0, 50).map((tx) => (
              <li
                key={tx.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div>
                  <span>{tx.memo || categoryNames[tx.categoryId ?? ''] || 'Expense'}</span>
                  <span className="muted" style={{ marginLeft: '0.5rem' }}>
                    {tx.date} {accountNames[tx.accountId ?? ''] && `· ${accountNames[tx.accountId!]}`}
                  </span>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                    aria-label="Delete"
                  >
                    ✕
                  </button>
                </span>
              </li>
            ))}
          </ul>
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
    </>
  )
}
