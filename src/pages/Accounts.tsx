import { useState, useEffect } from 'react'
import { getState, updateState, subscribe, id } from '../store'
import { replaceLocalState } from '../budgetSync'
import { useTranslation } from '../LanguageContext'
import { useUndo } from '../UndoContext'
import { formatCurrency } from '../utils'
import type { Account, Transaction } from '../types'

export default function Accounts() {
  const { t } = useTranslation()
  const { showUndo } = useUndo()
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
  const [income, setIncome] = useState(() => getState().monthlyIncome)
  const [incomeSaved, setIncomeSaved] = useState(false)

  const WALLET_SHOW_TRANSFER_KEY = 'budget-wallet-show-transfer'
  const WALLET_SHOW_ACCOUNTS_KEY = 'budget-wallet-show-accounts'
  const [showTransfer, setShowTransfer] = useState(() => {
    if (typeof localStorage === 'undefined') return false
    return localStorage.getItem(WALLET_SHOW_TRANSFER_KEY) === '1'
  })
  const [showMultipleAccounts, setShowMultipleAccounts] = useState(() => {
    if (typeof localStorage === 'undefined') return false
    return localStorage.getItem(WALLET_SHOW_ACCOUNTS_KEY) === '1'
  })
  const [reconcilingId, setReconcilingId] = useState<string | null>(null)
  const [reconcileValue, setReconcileValue] = useState('')
  const setShowTransferAndSave = (value: boolean) => {
    setShowTransfer(value)
    localStorage.setItem(WALLET_SHOW_TRANSFER_KEY, value ? '1' : '0')
  }
  const setShowMultipleAccountsAndSave = (value: boolean) => {
    setShowMultipleAccounts(value)
    localStorage.setItem(WALLET_SHOW_ACCOUNTS_KEY, value ? '1' : '0')
  }

  useEffect(() => {
    const s = getState()
    setState(s)
    setAccounts(s.accounts)
    setIncome(s.monthlyIncome)
  }, [])
  useEffect(() => {
    return subscribe(() => {
      const s = getState()
      setState(s)
      setAccounts(s.accounts)
      setIncome(s.monthlyIncome)
    })
  }, [])

  const saveIncome = (e: React.FormEvent) => {
    e.preventDefault()
    const next = updateState((s) => {
      const nextState = { ...s, monthlyIncome: income }
      // If user has exactly one account and no balance set, use income as that account's balance
      if (s.accounts.length === 1 && (s.accounts[0].balance === undefined || s.accounts[0].balance === 0)) {
        nextState.accounts = s.accounts.map((a) => ({ ...a, balance: income }))
      }
      return nextState
    })
    setState(next)
    setAccounts(next.accounts)
    setIncomeSaved(true)
    setTimeout(() => setIncomeSaved(false), 2000)
  }

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const next = updateState((s) => ({
      ...s,
      accounts: [...s.accounts, { id: id(), name: name.trim(), purpose: purpose.trim() || undefined }],
    }))
    setState(next)
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
    setState(next)
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
    setState(next)
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
    setState(next)
    setAccounts(next.accounts)
  }

  const addTransfer = (e: React.FormEvent) => {
    e.preventDefault()
    const fromId = transferFrom.trim()
    const toId = transferTo.trim()
    const amount = Number(transferAmount)
    if (!fromId || !toId || fromId === toId || !Number.isFinite(amount) || amount <= 0) return
    const next = updateState((s) => {
      const fromAccount = s.accounts.find((a) => a.id === fromId)
      const toAccount = s.accounts.find((a) => a.id === toId)
      const fromBalance = (fromAccount?.balance ?? 0) - amount
      const toBalance = (toAccount?.balance ?? 0) + amount
      return {
        ...s,
        accounts: s.accounts.map((a) => {
          if (a.id === fromId) return { ...a, balance: fromBalance }
          if (a.id === toId) return { ...a, balance: toBalance }
          return a
        }),
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
      }
    })
    setState(next)
    setAccounts(next.accounts)
    setTransferFrom('')
    setTransferTo('')
    setTransferAmount('')
    setTransferDate(new Date().toISOString().slice(0, 10))
    setTransferMemo('')
  }

  const removeTransfer = (txId: string) => {
    if (!confirm(t('accounts.transferDeleteConfirm'))) return
    const snapshot = getState()
    const tx = state.transactions.find((t) => t.id === txId)
    if (tx?.type !== 'transfer' || !tx.toAccountId) {
      const next = updateState((s) => ({ ...s, transactions: s.transactions.filter((t) => t.id !== txId) }))
      setState(next)
      setAccounts(next.accounts)
      showUndo(() => replaceLocalState(snapshot))
      return
    }
    const amount = tx.amount
    const fromId = tx.accountId ?? ''
    const toId = tx.toAccountId
    const next = updateState((s) => {
      const fromAccount = s.accounts.find((a) => a.id === fromId)
      const toAccount = s.accounts.find((a) => a.id === toId)
      const fromBalance = (fromAccount?.balance ?? 0) + amount
      const toBalance = (toAccount?.balance ?? 0) - amount
      return {
        ...s,
        accounts: s.accounts.map((a) => {
          if (a.id === fromId) return { ...a, balance: fromBalance }
          if (a.id === toId) return { ...a, balance: toBalance }
          return a
        }),
        transactions: s.transactions.filter((t) => t.id !== txId),
      }
    })
    setState(next)
    setAccounts(next.accounts)
    showUndo(() => replaceLocalState(snapshot))
  }

  const transfers = [...state.transactions]
    .filter((t): t is Transaction & { toAccountId: string } => t.type === 'transfer' && !!t.toAccountId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 30)
  const accountNames = Object.fromEntries(state.accounts.map((a) => [a.id, a.name]))

  return (
    <div className="wallet-page">
      <h1 style={{ marginTop: 0, marginBottom: '0.5rem' }}>{t('accounts.pageTitle')}</h1>
      <p className="muted" style={{ marginBottom: '1rem' }}>
        {t('accounts.subtitle')}
      </p>

      <div className="wallet-grid">
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>{t('income.monthlyTitle')}</h2>
        <p className="muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>{t('income.subtitleLong')}</p>
        <form onSubmit={saveIncome}>
          <div className="form-group">
            <label htmlFor="income-amount">{t('income.amount')} ({state.currency}/{t('income.perMonth')})</label>
            <input
              id="income-amount"
              type="number"
              min="0"
              step="0.01"
              value={income === 0 ? '' : income}
              onChange={(e) => setIncome(parseFloat(e.target.value) || 0)}
              placeholder={t('income.amountPlaceholder')}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            {incomeSaved ? t('income.saved') : t('income.saveIncome')}
          </button>
        </form>
        {income > 0 && (
          <p className="muted" style={{ marginTop: '1rem', marginBottom: 0 }}>
            {t('income.basedOn')} {formatCurrency(income, state.currency)} {t('income.perMonth')}.
          </p>
        )}
        </div>

        {showMultipleAccounts && (
        <form onSubmit={add} className="card">
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
        )}
      </div>

      <div className="wallet-options-toggles" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
        <label className="wallet-transfer-toggle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showMultipleAccounts}
            onChange={(e) => setShowMultipleAccountsAndSave(e.target.checked)}
            aria-describedby="wallet-accounts-toggle-desc"
          />
          <span id="wallet-accounts-toggle-desc">{t('accounts.showMultipleAccounts')}</span>
        </label>
        <label className="wallet-transfer-toggle" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showTransfer}
            onChange={(e) => setShowTransferAndSave(e.target.checked)}
            aria-describedby="wallet-transfer-toggle-desc"
          />
          <span id="wallet-transfer-toggle-desc">{t('accounts.showTransferOption')}</span>
        </label>
      </div>

      {showTransfer && (
      <div className="wallet-grid">
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>{t('accounts.transferTitle')}</h2>
        {accounts.length >= 2 ? (
          <form onSubmit={addTransfer}>
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
        ) : (
          <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>{t('accounts.transferNeedTwo')}</p>
        )}
        </div>

        {transfers.length > 0 && (
          <div className="card">
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
      </div>
      )}

      {showMultipleAccounts && state.accounts.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>{t('accounts.title')}</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {state.accounts.map((a) => (
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
                      placeholder={t('accounts.editNamePlaceholder')}
                      style={{ flex: '1 1 120px', padding: '0.4rem' }}
                    />
                    <input
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder={t('accounts.editPurposePlaceholder')}
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
                          step="1"
                          value={a.balance !== undefined && a.balance !== null ? a.balance : ''}
                          onChange={(e) => setBalance(a.id, Number(e.target.value) || 0)}
                          placeholder={t('accounts.balancePlaceholder')}
                          className="accounts-balance-input"
                          style={{ width: '6rem', padding: '0.25rem 0.4rem', marginLeft: '0.25rem' }}
                        />
                      </div>
                      <p className="muted" style={{ marginTop: '0.25rem', marginBottom: 0, fontSize: '0.85rem' }}>
                        {t('accounts.balanceReconcileNote')}
                      </p>
                      {reconcilingId === a.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                          <label className="muted" style={{ fontSize: '0.9rem' }}>{t('accounts.setBalanceTo')}</label>
                          <input
                            type="number"
                            step="any"
                            value={reconcileValue}
                            onChange={(e) => setReconcileValue(e.target.value)}
                            placeholder={t('accounts.balancePlaceholder')}
                            style={{ width: '6rem', padding: '0.25rem 0.4rem' }}
                          />
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                              const n = Number(reconcileValue)
                              if (!Number.isNaN(n)) {
                                setBalance(a.id, n)
                                setReconcilingId(null)
                                setReconcileValue('')
                              }
                            }}
                          >
                            {t('common.save')}
                          </button>
                          <button type="button" className="btn btn-ghost" onClick={() => { setReconcilingId(null); setReconcileValue('') }}>{t('common.cancel')}</button>
                        </div>
                      ) : null}
                    </div>
                    <span style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="button" className="btn btn-ghost" onClick={() => { setReconcilingId(a.id); setReconcileValue(String(a.balance ?? '')) }}>{t('accounts.reconcile')}</button>
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
    </div>
  )
}
