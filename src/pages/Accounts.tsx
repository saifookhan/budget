import { useState, useEffect } from 'react'
import { getState, updateState, subscribe, id } from '../store'
import { useTranslation } from '../LanguageContext'
import { formatCurrency } from '../utils'
import type { Account, Transaction } from '../types'

export default function Accounts() {
  const { t } = useTranslation()
  const [state, setState] = useState(() => getState())
  const [accounts, setAccounts] = useState<Account[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')
  const [transferFrom, setTransferFrom] = useState('')
  const [transferTo, setTransferTo] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [transferDate, setTransferDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [transferMemo, setTransferMemo] = useState('')

  useEffect(() => {
    const s = getState()
    setState(s)
    setAccounts(s.accounts)
  }, [])
  useEffect(() => {
    return subscribe(() => {
      const s = getState()
      setState(s)
      setAccounts(s.accounts)
    })
  }, [])

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const next = updateState((s) => ({
      ...s,
      accounts: [...s.accounts, { id: id(), name: name.trim(), purpose: purpose.trim() || undefined }],
    }))
    setAccounts(next.accounts)
    setName('')
    setPurpose('')
  }

  const remove = (accountId: string) => {
    if (!confirm(t('accounts.removeConfirm'))) return
    const next = updateState((s) => ({
      ...s,
      accounts: s.accounts.filter((a) => a.id !== accountId),
    }))
    setAccounts(next.accounts)
    setEditing(null)
  }

  const startEdit = (a: Account) => {
    setEditing(a.id)
    setName(a.name)
    setPurpose(a.purpose ?? '')
  }

  const saveEdit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing || !name.trim()) return
    const next = updateState((s) => ({
      ...s,
      accounts: s.accounts.map((a) =>
        a.id === editing ? { ...a, name: name.trim(), purpose: purpose.trim() || undefined } : a
      ),
    }))
    setAccounts(next.accounts)
    setEditing(null)
    setName('')
    setPurpose('')
  }

  const setBalance = (accountId: string, value: number) => {
    const next = updateState((s) => ({
      ...s,
      accounts: s.accounts.map((a) =>
        a.id === accountId ? { ...a, balance: value === 0 ? undefined : value } : a
      ),
    }))
    setAccounts(next.accounts)
  }

  const addTransfer = (e: React.FormEvent) => {
    e.preventDefault()
    const fromId = transferFrom.trim()
    const toId = transferTo.trim()
    const amount = Number(transferAmount)
    if (!fromId || !toId || fromId === toId || !Number.isFinite(amount) || amount <= 0) return
    const accountNames = Object.fromEntries(state.accounts.map((a) => [a.id, a.name]))
    updateState((s) => ({
      ...s,
      transactions: [
        ...s.transactions,
        {
          id: id(),
          type: 'transfer',
          amount,
          accountId: fromId,
          toAccountId: toId,
          date: transferDate,
          memo: transferMemo.trim() || undefined,
        },
      ],
    }))
    setTransferFrom('')
    setTransferTo('')
    setTransferAmount('')
    setTransferDate(new Date().toISOString().slice(0, 10))
    setTransferMemo('')
  }

  const removeTransfer = (txId: string) => {
    if (!confirm(t('accounts.transferDeleteConfirm'))) return
    updateState((s) => ({
      ...s,
      transactions: s.transactions.filter((t) => t.id !== txId),
    }))
  }

  const transfers = [...state.transactions]
    .filter((t): t is Transaction & { toAccountId: string } => t.type === 'transfer' && !!t.toAccountId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 30)
  const accountNames = Object.fromEntries(state.accounts.map((a) => [a.id, a.name]))

  return (
    <>
      <h1 style={{ marginTop: 0, marginBottom: '0.5rem' }}>{t('accounts.title')}</h1>
      <p className="muted" style={{ marginBottom: '1.5rem' }}>
        {t('accounts.subtitle')}
      </p>

      <form onSubmit={add} className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>{t('accounts.addAccount')}</h2>
        <div className="form-group">
          <label htmlFor="acc-name">{t('accounts.name')}</label>
          <input
            id="acc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('accounts.namePlaceholder')}
          />
        </div>
        <div className="form-group">
          <label htmlFor="acc-purpose">{t('accounts.purpose')}</label>
          <input
            id="acc-purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder={t('accounts.purposePlaceholder')}
          />
        </div>
        <button type="submit" className="btn btn-primary">
          {t('accounts.addButton')}
        </button>
      </form>

      {accounts.length >= 2 && (
        <form onSubmit={addTransfer} className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>{t('accounts.transferTitle')}</h2>
          <p className="muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>{t('accounts.transferSubtitle')}</p>
          <div className="form-group">
            <label htmlFor="transfer-from">{t('accounts.transferFrom')}</label>
            <select
              id="transfer-from"
              value={transferFrom}
              onChange={(e) => setTransferFrom(e.target.value)}
              required
            >
              <option value="">{t('common.select')}</option>
              {state.accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="transfer-to">{t('accounts.transferTo')}</label>
            <select
              id="transfer-to"
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              required
            >
              <option value="">{t('common.select')}</option>
              {state.accounts.map((a) => (
                <option key={a.id} value={a.id} disabled={a.id === transferFrom}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="transfer-amount">{t('accounts.transferAmount')}</label>
            <input
              id="transfer-amount"
              type="number"
              min="0.01"
              step="any"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="0"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="transfer-date">{t('expenses.date')}</label>
            <input
              id="transfer-date"
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="transfer-memo">{t('accounts.transferMemo')}</label>
            <input
              id="transfer-memo"
              value={transferMemo}
              onChange={(e) => setTransferMemo(e.target.value)}
              placeholder={t('accounts.transferMemoPlaceholder')}
            />
          </div>
          <button type="submit" className="btn btn-primary">{t('accounts.transferButton')}</button>
        </form>
      )}

      {transfers.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>{t('accounts.recentTransfers')}</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {transfers.map((tx) => (
              <li
                key={tx.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.35rem',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span className="muted" style={{ fontSize: '0.9rem' }}>{tx.date}</span>
                <span>
                  {accountNames[tx.accountId ?? ''] ?? '?'} → {accountNames[tx.toAccountId] ?? '?'}
                  {tx.memo && <span className="muted"> · {tx.memo}</span>}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong>{formatCurrency(tx.amount, state.currency)}</strong>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.85rem' }}
                    onClick={() => removeTransfer(tx.id)}
                    aria-label={t('common.remove')}
                  >
                    ✕
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {accounts.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>{t('accounts.title')}</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {accounts.map((a) => (
              <li
                key={a.id}
                style={{
                  padding: '0.75rem 0',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                {editing === a.id ? (
                  <form onSubmit={saveEdit} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', width: '100%' }}>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Name"
                      style={{ flex: '1 1 120px', padding: '0.4rem' }}
                    />
                    <input
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="Purpose"
                      style={{ flex: '1 1 120px', padding: '0.4rem' }}
                    />
                    <button type="submit" className="btn btn-primary">{t('common.save')}</button>
                    <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>{t('common.cancel')}</button>
                  </form>
                ) : (
                  <>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{a.name}</strong>
                      {a.purpose && <span className="muted"> — {a.purpose}</span>}
                      <div className="muted" style={{ marginTop: '0.35rem', fontSize: '0.9rem' }}>
                        {t('accounts.balance')}:{' '}
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={a.balance ?? ''}
                          onChange={(e) => setBalance(a.id, Number(e.target.value) || 0)}
                          placeholder="0"
                          style={{ width: '6rem', padding: '0.25rem 0.4rem', marginLeft: '0.25rem' }}
                        />
                      </div>
                    </div>
                    <span style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="button" className="btn btn-ghost" onClick={() => startEdit(a)}>{t('common.edit')}</button>
                      <button type="button" className="btn btn-ghost" onClick={() => remove(a.id)}>{t('common.remove')}</button>
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}
