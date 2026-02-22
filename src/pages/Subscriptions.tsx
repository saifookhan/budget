import { useState, useEffect } from 'react'
import { getState, updateState, id } from '../store'
import { formatCurrency } from '../utils'
import type { RecurringItem } from '../types'

export default function Subscriptions() {
  const state = getState()
  const [recurring, setRecurring] = useState<RecurringItem[]>([])
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [dayOfMonth, setDayOfMonth] = useState('1')

  useEffect(() => {
    setRecurring(getState().recurring.filter((r) => r.type === 'subscription'))
  }, [])

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const num = Math.round(parseFloat(amount) * 100) / 100
    if (!(num > 0) || !label.trim()) return
    const day = Math.min(28, Math.max(1, parseInt(dayOfMonth, 10) || 1))
    const next = updateState((s) => ({
      ...s,
      recurring: [
        ...s.recurring,
        {
          id: id(),
          label: label.trim(),
          amount: num,
          categoryId: categoryId || undefined,
          accountId: accountId || undefined,
          dayOfMonth: day,
          type: 'subscription',
        },
      ],
    }))
    setRecurring(next.recurring.filter((r) => r.type === 'subscription'))
    setLabel('')
    setAmount('')
    setDayOfMonth('1')
  }

  const remove = (recId: string) => {
    if (!confirm('Remove this subscription? It will stop being added each month.')) return
    const next = updateState((s) => ({
      ...s,
      recurring: s.recurring.filter((r) => r.id !== recId),
    }))
    setRecurring(next.recurring.filter((r) => r.type === 'subscription'))
  }

  const categoryNames = Object.fromEntries(state.categories.map((c) => [c.id, c.name]))
  const accountNames = Object.fromEntries(state.accounts.map((a) => [a.id, a.name]))
  const totalPerMonth = recurring.reduce((s, r) => s + r.amount, 0)

  return (
    <>
      <h1 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Subscriptions</h1>
      <p className="muted" style={{ marginBottom: '1.5rem' }}>
        Add monthly subscriptions (Netflix, gym, etc.). They are automatically added at the start of each month so you always see how much you spend per category.
      </p>

      <form onSubmit={add} className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Add subscription</h2>
        <div className="form-group">
          <label htmlFor="sub-label">Name</label>
          <input
            id="sub-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Netflix, Gym"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="sub-amount">Amount (€/month)</label>
          <input
            id="sub-amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 12.99"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="sub-day">Day of month (1–28)</label>
          <input
            id="sub-day"
            type="number"
            min="1"
            max="28"
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="sub-category">Category</label>
          <select
            id="sub-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">— Select —</option>
            {state.categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="sub-account">Account</label>
          <select
            id="sub-account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">— Select —</option>
            {state.accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary">
          Add subscription
        </button>
      </form>

      {recurring.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Monthly subscriptions</h2>
          <p className="muted" style={{ marginBottom: '0.75rem' }}>
            Total: <strong>{formatCurrency(totalPerMonth)}</strong> per month
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {recurring.map((r) => (
              <li
                key={r.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div>
                  <strong>{r.label}</strong>
                  <span className="muted" style={{ marginLeft: '0.5rem' }}>
                    {categoryNames[r.categoryId ?? ''] && `· ${categoryNames[r.categoryId!]}`}
                    {accountNames[r.accountId ?? ''] && ` · ${accountNames[r.accountId!]}`}
                    {' · day '}{r.dayOfMonth}
                  </span>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="amount-negative">{formatCurrency(r.amount)}/mo</span>
                  <button type="button" className="btn btn-ghost" onClick={() => remove(r.id)} aria-label="Remove">✕</button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
