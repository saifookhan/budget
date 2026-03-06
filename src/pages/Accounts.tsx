import { useState, useEffect } from 'react'
import { getState, updateState, id } from '../store'
import { useTranslation } from '../LanguageContext'
import type { Account } from '../types'

export default function Accounts() {
  const { t } = useTranslation()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [purpose, setPurpose] = useState('')

  useEffect(() => {
    setAccounts(getState().accounts)
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
