import { useState, useEffect } from 'react'
import { getState, setState } from '../store'
import { formatCurrency } from '../utils'

export default function Income() {
  const state = getState()
  const [income, setIncome] = useState(state.monthlyIncome)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setIncome(getState().monthlyIncome)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setState({ monthlyIncome: income })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <>
      <h1 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Monthly income</h1>
      <p className="muted" style={{ marginBottom: '1.5rem' }}>
        Enter your total take-home income per month. You can edit this anytime and click Save to update.
      </p>

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label htmlFor="income">Income ({state.currency}/month)</label>
          <input
            id="income"
            type="number"
            min="0"
            step="0.01"
            value={income === 0 ? '' : income}
            onChange={(e) => setIncome(parseFloat(e.target.value) || 0)}
            placeholder="e.g. 2500"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          {saved ? 'Saved ✓' : 'Save income'}
        </button>
      </form>

      {income > 0 && (
        <p className="muted" style={{ marginTop: '1rem' }}>
          Your budget is based on {formatCurrency(income, state.currency)} per month.
        </p>
      )}
    </>
  )
}
