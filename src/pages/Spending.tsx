import { useState, useEffect } from 'react'
import { getState, updateState, id } from '../store'
import { formatCurrency, isCurrentMonth } from '../utils'
import type { Transaction } from '../types'

export default function Spending() {
  const state = getState()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [memo, setMemo] = useState('')

  useEffect(() => {
    setTransactions(getState().transactions.filter((t) => t.type === 'expense'))
  }, [])

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const num = Math.round(parseFloat(amount) * 100) / 100
    if (!(num > 0)) return
    const date = new Date().toISOString().slice(0, 10)
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
          date,
          memo: memo.trim() || undefined,
        },
      ],
    }))
    setTransactions(next.transactions.filter((t) => t.type === 'expense'))
    setAmount('')
    setMemo('')
  }

  const remove = (txId: string) => {
    if (!confirm('Delete this expense?')) return
    const next = updateState((s) => ({
      ...s,
      transactions: s.transactions.filter((t) => t.id !== txId),
    }))
    setTransactions(next.transactions.filter((t) => t.type === 'expense'))
  }

  const categories = state.categories
  const accounts = state.accounts
  const categoryNames = Object.fromEntries(categories.map((c) => [c.id, c.name]))
  const accountNames = Object.fromEntries(accounts.map((a) => [a.id, a.name]))

  const sorted = [...transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <>
      <h1 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Spending</h1>
      <p className="muted" style={{ marginBottom: '1.5rem' }}>
        Add one-off expenses. For monthly subscriptions, use the Subscriptions page so they're added automatically each month.
      </p>

      <form onSubmit={add} className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Add expense</h2>
        <div className="form-group">
          <label htmlFor="sp-amount">Amount (€)</label>
          <input
            id="sp-amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 45.50"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="sp-category">Category</label>
          <select
            id="sp-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">— Select —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="sp-account">Account</label>
          <select
            id="sp-account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">— Select —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="sp-memo">Note (optional)</label>
          <input
            id="sp-memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="e.g. Weekly shop"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Add expense
        </button>
      </form>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Recent expenses</h2>
        {sorted.length === 0 ? (
          <p className="muted">No expenses yet. Add one above.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {sorted.slice(0, 50).map((t) => (
              <li
                key={t.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div>
                  <span>{t.memo || categoryNames[t.categoryId ?? ''] || 'Expense'}</span>
                  <span className="muted" style={{ marginLeft: '0.5rem' }}>
                    {t.date} {accountNames[t.accountId ?? ''] && `· ${accountNames[t.accountId!]}`}
                  </span>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="amount-negative">{formatCurrency(t.amount)}</span>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => remove(t.id)}
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
    </>
  )
}
