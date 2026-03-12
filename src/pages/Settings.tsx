import { THEMES, type ThemeId } from '../theme'
import { CURRENCIES, LANGUAGES } from '../constants'
import type { CurrencyCode, LanguageCode } from '../types'

type SettingsProps = {
  theme: ThemeId
  setTheme: (id: ThemeId) => void
  currency: CurrencyCode
  onCurrencyChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  language: LanguageCode
  onLanguageChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  user: { id: string } | null
  onLogOut: () => void
  T: (key: string) => string
  lastSyncedAt: string | null
  onRefreshFromServer: () => void | Promise<void>
  refreshFromServerLoading: boolean
  refreshFromServerDone: boolean
}

function formatLastSynced(iso: string): string {
  try {
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return iso
  }
}

export default function Settings({
  theme,
  setTheme,
  currency,
  onCurrencyChange,
  language,
  onLanguageChange,
  user,
  onLogOut,
  T,
  lastSyncedAt,
  onRefreshFromServer,
  refreshFromServerLoading,
  refreshFromServerDone,
}: SettingsProps) {
  return (
    <>
      <h1 style={{ marginTop: 0, marginBottom: '0.5rem' }}>{T('nav.settings')}</h1>
      <p className="muted" style={{ marginBottom: '1.5rem' }}>
        Change theme, currency, and language.
      </p>
      <div className="card settings-page-card">
        {user && (
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            {lastSyncedAt ? (
              <p className="muted" style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                {T('sync.lastSyncedAt')} {formatLastSynced(lastSyncedAt)}
              </p>
            ) : null}
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => onRefreshFromServer()}
              disabled={refreshFromServerLoading}
            >
              {refreshFromServerLoading ? '…' : refreshFromServerDone ? T('sync.refreshed') : T('sync.refreshFromServer')}
            </button>
          </div>
        )}
        <div className="form-group">
          <label htmlFor="settings-theme">{T('nav.theme')}</label>
          <select
            id="settings-theme"
            className="theme-dropdown"
            value={theme}
            onChange={(e) => setTheme(e.target.value as ThemeId)}
            aria-label="Change color scheme"
          >
            {THEMES.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="settings-currency">{T('nav.currency')}</label>
          <select
            id="settings-currency"
            className="theme-dropdown"
            value={currency}
            onChange={onCurrencyChange}
            aria-label="Change currency"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="settings-language">{T('nav.language')}</label>
          <select
            id="settings-language"
            className="theme-dropdown"
            value={language}
            onChange={onLanguageChange}
            aria-label="Change language"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
            ))}
          </select>
        </div>
        {user && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onLogOut}
            style={{ marginTop: '0.5rem' }}
          >
            {T('nav.logOut')}
          </button>
        )}
      </div>
    </>
  )
}
