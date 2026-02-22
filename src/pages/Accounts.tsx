import { useState, useEffect } from 'react'
import { getState, updateState, id } from '../store'
import type { Account } from '../types'

export default function Accounts() {
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
    if (!confirm('Remove this account? Transactions linked to it will keep the link but show "Unknown account".')) return
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

  return (
    <>
      <h1 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Accounts</h1>
      <p className="muted" style={{ marginBottom: '1.5rem' }}>
        Add accounts like Revolut (for groceries), your bank (for rent), etc. You can assign transactions and recurring items to each.
      </p>

      <form onSubmit={add} className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Add account</h2>
        <div className="form-group">
          <label htmlFor="acc-name">Name</label>
          <input
            id="acc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Revolut, N26, Main bank"
          />
        </div>
        <div className="form-group">
          <label htmlFor="acc-purpose">Purpose (optional)</label>
          <input
            id="acc-purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g. Groceries, Rent"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Add account
        </button>
      </form>

      {accounts.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Your accounts</h2>
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
                    <button type="submit" className="btn btn-primary">Save</button>
                    <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
                  </form>
                ) : (
                  <>
                    <div>
                      <strong>{a.name}</strong>
                      {a.purpose && <span className="muted"> — {a.purpose}</span>}
                    </div>
                    <span>
                      <button type="button" className="btn btn-ghost" onClick={() => startEdit(a)}>Edit</button>
                      <button type="button" className="btn btn-ghost" onClick={() => remove(a.id)}>Remove</button>
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
