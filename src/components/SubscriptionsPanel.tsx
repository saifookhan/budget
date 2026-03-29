import { useState, useEffect, useMemo, useCallback } from 'react'
import { getState, updateState, id, subscribe } from '../store'
import { useTranslation } from '../LanguageContext'
import { formatCurrency } from '../utils'
import type { BudgetState, RecurringItem } from '../types'

export default function SubscriptionsPanel() {
  const { t } = useTranslation()
  const [state, setState] = useState<BudgetState>(() => getState())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [dayOfMonth, setDayOfMonth] = useState('1')

  useEffect(() => {
    setState(getState())
  }, [])
  useEffect(() => {
    return subscribe(() => setState(getState()))
  }, [])

  const recurring = useMemo(
    () => state.recurring.filter((r) => r.type === 'subscription'),
    [state.recurring]
  )

  const startEdit = (r: RecurringItem) => {
    setEditingId(r.id)
    setLabel(r.label)
    setAmount(String(r.amount))
    setCategoryId(r.categoryId ?? '')
    setAccountId(r.accountId ?? '')
    setDayOfMonth(String(r.dayOfMonth))
  }

  const cancelEdit = useCallback(() => {
    setEditingId(null)
    setLabel('')
    setAmount('')
    setCategoryId('')
    setAccountId('')
    setDayOfMonth('1')
  }, [])

  useEffect(() => {
    if (editingId && !recurring.some((r) => r.id === editingId)) cancelEdit()
  }, [editingId, recurring, cancelEdit])

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const num = Math.round(parseFloat(amount) * 100) / 100
    if (!(num > 0) || !label.trim()) return
    const day = Math.min(31, Math.max(1, parseInt(dayOfMonth, 10) || 1))
    if (editingId) {
      updateState((s) => ({
        ...s,
        recurring: s.recurring.map((r) =>
          r.id === editingId
            ? {
                ...r,
                label: label.trim(),
                amount: num,
                categoryId: categoryId || undefined,
                accountId: accountId || undefined,
                dayOfMonth: day,
              }
            : r
        ),
      }))
      cancelEdit()
    } else {
      updateState((s) => ({
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
      setLabel('')
      setAmount('')
      setDayOfMonth('1')
    }
  }

  const remove = (recId: string) => {
    if (!confirm(t('subscriptions.removeConfirm'))) return
    if (editingId === recId) cancelEdit()
    updateState((s) => ({
      ...s,
      recurring: s.recurring.filter((r) => r.id !== recId),
    }))
  }

  const categoryNames = Object.fromEntries(state.categories.map((c) => [c.id, c.name]))
  const accountNames = Object.fromEntries(state.accounts.map((a) => [a.id, a.name]))
  const totalPerMonth = recurring.reduce((s, r) => s + r.amount, 0)

  return (
    <div className="subscriptions-panel">
      <form onSubmit={save} className="card" style={{ marginBottom: '1rem' }}>
        <h2 className="section-title">
          {editingId ? t('subscriptions.editSubscription') : t('subscriptions.addSubscription')}
        </h2>
        <div className="form-group">
          <label htmlFor="sub-label">{t('subscriptions.name')}</label>
          <input
            id="sub-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t('subscriptions.namePlaceholder')}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="sub-amount">{t('subscriptions.amount')}</label>
          <input
            id="sub-amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t('subscriptions.amountPlaceholder')}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="sub-day">{t('subscriptions.dayOfMonth')}</label>
          <input
            id="sub-day"
            type="number"
            min="1"
            max="31"
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="sub-category">{t('subscriptions.category')}</label>
          <select id="sub-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">{t('common.select')}</option>
            {state.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="sub-account">{t('subscriptions.account')}</label>
          <select id="sub-account" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">{t('common.select')}</option>
            {state.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="submit" className="btn btn-primary">
            {editingId ? t('subscriptions.updateButton') : t('subscriptions.addButton')}
          </button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={cancelEdit}>
              {t('common.cancel')}
            </button>
          )}
        </div>
      </form>

      {recurring.length > 0 && (
        <div className="card">
          <h2 className="section-title">{t('subscriptions.monthlyList')}</h2>
          <p className="muted" style={{ marginBottom: '0.75rem' }}>
            {t('subscriptions.totalPerMonth')}: <strong>{formatCurrency(totalPerMonth)}</strong>{' '}
            {t('subscriptions.perMonth')}
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
                    {' · '}
                    {t('subscriptions.day')} {r.dayOfMonth}
                  </span>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="amount-negative">{formatCurrency(r.amount)}/mo</span>
                  <button type="button" className="btn btn-ghost" onClick={() => startEdit(r)} aria-label={t('common.edit')}>
                    {t('common.edit')}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => remove(r.id)} aria-label="Remove">
                    ✕
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
