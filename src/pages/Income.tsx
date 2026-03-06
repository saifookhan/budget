import { useState, useEffect } from 'react'
import { getState, setState } from '../store'
import { useTranslation } from '../LanguageContext'
import { formatCurrency } from '../utils'

export default function Income() {
  const { t } = useTranslation()
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
      <h1 style={{ marginTop: 0, marginBottom: '0.5rem' }}>{t('income.monthlyTitle')}</h1>
      <p className="muted" style={{ marginBottom: '1.5rem' }}>
        {t('income.subtitleLong')}
      </p>

      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label htmlFor="income">{t('income.amount')} ({state.currency}/{t('income.perMonth')})</label>
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
          {saved ? t('income.saved') : t('income.saveIncome')}
        </button>
      </form>

      {income > 0 && (
        <p className="muted" style={{ marginTop: '1rem' }}>
          {t('income.basedOn')} {formatCurrency(income, state.currency)} {t('income.perMonth')}.
        </p>
      )}
    </>
  )
}
