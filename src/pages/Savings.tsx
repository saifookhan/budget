import { useState, useEffect } from 'react'
import { getState, updateState, id } from '../store'
import { formatCurrency, getCurrentMonthKey } from '../utils'
import type { SavingsGoal, RecurringItem } from '../types'

function monthsBetween(start: string, endKey: string): number {
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = endKey.split('-').map(Number)
  return (ey - sy) * 12 + (em - sm) + 1
}

export default function Savings() {
  const state = getState()
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [name, setName] = useState('')
  const [monthlyAmount, setMonthlyAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const monthKey = getCurrentMonthKey()

  useEffect(() => {
    setGoals(getState().savingsGoals)
  }, [])

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const num = Math.round(parseFloat(monthlyAmount) * 100) / 100
    if (!(num > 0) || !name.trim()) return
    const startDate = new Date().toISOString().slice(0, 10)
    const recurringId = id()
    const goalId = id()
    const next = updateState((s) => {
      const recurring: RecurringItem = {
        id: recurringId,
        label: name.trim(),
        amount: num,
        accountId: accountId || undefined,
        dayOfMonth: 1,
        type: 'saving',
      }
      const goal: SavingsGoal = {
        id: goalId,
        name: name.trim(),
        monthlyAmount: num,
        startDate,
        accountId: accountId || undefined,
        recurringId,
      }
      return {
        ...s,
        recurring: [...s.recurring, recurring],
        savingsGoals: [...s.savingsGoals, goal],
      }
    })
    setGoals(next.savingsGoals)
    setName('')
    setMonthlyAmount('')
    setAccountId('')
  }

  const remove = (goalId: string) => {
    const goal = goals.find((g) => g.id === goalId)
    if (!goal || !confirm('Remove this savings goal? Recurring monthly amount will stop.')) return
    const next = updateState((s) => ({
      ...s,
      savingsGoals: s.savingsGoals.filter((g) => g.id !== goalId),
      recurring: s.recurring.filter((r) => r.id !== goal.recurringId),
    }))
    setGoals(next.savingsGoals)
  }

  const accountNames = Object.fromEntries(state.accounts.map((a) => [a.id, a.name]))

  return (
    <>
      <h1 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Savings & investments</h1>
      <p className="muted" style={{ marginBottom: '1.5rem' }}>
        Set a monthly amount (e.g. 100€). It will be added automatically at the beginning of each month so you see how much you've saved since you started.
      </p>

      <form onSubmit={add} className="card" style={{ marginBottom: '1rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Add savings goal</h2>
        <div className="form-group">
          <label htmlFor="sav-name">Name</label>
          <input
            id="sav-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Emergency fund, ETF"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="sav-amount">Amount (€/month)</label>
          <input
            id="sav-amount"
            type="number"
            min="0"
            step="0.01"
            value={monthlyAmount}
            onChange={(e) => setMonthlyAmount(e.target.value)}
            placeholder="e.g. 100"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="sav-account">Account (optional)</label>
          <select
            id="sav-account"
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
          Add savings goal
        </button>
      </form>

      {goals.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Your savings</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {goals.map((g) => {
              const startKey = g.startDate.slice(0, 7)
              const months = monthsBetween(startKey, monthKey)
              const totalSaved = months * g.monthlyAmount
              return (
                <li
                  key={g.id}
                  style={{
                    padding: '1rem 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <strong>{g.name}</strong>
                      <span className="muted" style={{ marginLeft: '0.5rem' }}>
                        {accountNames[g.accountId ?? ''] && `· ${accountNames[g.accountId!]}`}
                      </span>
                      <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                        {formatCurrency(g.monthlyAmount)}/month since {g.startDate}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="amount-positive" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                        {formatCurrency(totalSaved)}
                      </div>
                      <span className="muted">saved so far</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <button type="button" className="btn btn-ghost" onClick={() => remove(g.id)}>
                      Remove goal
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </>
  )
}
