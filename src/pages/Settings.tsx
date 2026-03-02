import { getState, updateState } from '../store'
import { CURRENCIES } from '../constants'
import type { CurrencyCode } from '../types'

export default function Settings() {
  const state = getState()

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateState((s) => ({ ...s, currency: e.target.value as CurrencyCode }))
  }

  return (
    <>
      <h1 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Settings</h1>
      <p className="muted" style={{ marginBottom: '1.5rem' }}>
        App preferences
      </p>

      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Currency</h2>
        <p className="muted" style={{ marginBottom: '0.75rem' }}>
          All amounts in the app will be shown in this currency.
        </p>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="settings-currency">Currency</label>
          <select
            id="settings-currency"
            className="theme-dropdown"
            value={state.currency}
            onChange={handleCurrencyChange}
            aria-label="Currency"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  )
}
