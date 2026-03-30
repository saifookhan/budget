import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import { supabase, setKeepLoggedIn as persistKeepLoggedIn } from './supabase'
import { t } from './i18n'
import type { LanguageCode } from './types'

type Props = {
  onSuccess?: () => void
  /** When true, use compact layout (e.g. for homepage sidebar) */
  embedded?: boolean
  /** When provided, "Forgot password?" calls this instead of linking to /login */
  onForgotClick?: () => void
}

const BUDGET_STORAGE_KEY = 'budget-app-data'

function getAuthLanguage(): LanguageCode {
  try {
    if (typeof localStorage === 'undefined') return 'en'
    const raw = localStorage.getItem(BUDGET_STORAGE_KEY)
    if (!raw) return 'en'
    const state = JSON.parse(raw) as { language?: string }
    return (state?.language ?? 'en') as LanguageCode
  } catch {
    return 'en'
  }
}

export function LoginForm({ onSuccess, embedded, onForgotClick }: Props) {
  const { signIn, error, clearError } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [keepLoggedIn, setKeepLoggedIn] = useState(true)
  const [loading, setLoading] = useState(false)
  const authLang = getAuthLanguage()
  const T = (key: string) => t(key, authLang)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    persistKeepLoggedIn(keepLoggedIn)
    setLoading(true)
    try {
      await signIn(email, password)
      if (onSuccess) onSuccess()
      else navigate('/app', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  const notConfigured = !supabase

  return (
    <div className={embedded ? 'login-form-embedded' : undefined}>
      <h1 className="auth-title">{T('auth.logIn')}</h1>
      <p className="muted">
        {T('auth.logInSubtitle')}
      </p>

      {notConfigured && (
        <div className="auth-alert" role="alert">
          Supabase is not configured. Add <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env.local</code> (see{' '}
          <code>.env.example</code> and the setup guide in the README).
        </div>
      )}

      {error && !notConfigured && (
        <div className="auth-alert auth-alert-error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor={embedded ? 'home-login-email' : 'login-email'}>{T('auth.email')}</label>
          <input
            id={embedded ? 'home-login-email' : 'login-email'}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={T('auth.emailPlaceholder')}
            required
            disabled={notConfigured}
          />
        </div>
        <div className="form-group">
          <label htmlFor={embedded ? 'home-login-password' : 'login-password'}>{T('auth.password')}</label>
          <input
            id={embedded ? 'home-login-password' : 'login-password'}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={notConfigured}
          />
          <p style={{ marginTop: '0.35rem', marginBottom: 0 }}>
            {onForgotClick ? (
              <button type="button" className="btn-link" onClick={() => { clearError(); onForgotClick() }}>
                {T('auth.forgotPassword')}
              </button>
            ) : (
              <Link to="/login" className="btn-link" onClick={() => clearError()}>
                {T('auth.forgotPassword')}
              </Link>
            )}
          </p>
        </div>
        <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
          <input
            id={embedded ? 'home-keep-logged-in' : 'keep-logged-in'}
            type="checkbox"
            checked={keepLoggedIn}
            onChange={(e) => setKeepLoggedIn(e.target.checked)}
            disabled={notConfigured}
            aria-describedby="keep-logged-in-desc"
          />
          <label htmlFor={embedded ? 'home-keep-logged-in' : 'keep-logged-in'} id="keep-logged-in-desc" style={{ margin: 0, cursor: 'pointer' }}>
            {T('auth.keepMeLoggedIn')}
          </label>
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '0.25rem' }}
          disabled={loading || notConfigured}
        >
          {loading ? T('auth.signingIn') : T('auth.logIn')}
        </button>
      </form>

      <p className="auth-footer">
        {T('auth.dontHaveAccount')} <Link to="/signup">{T('auth.signUp')}</Link>
      </p>
    </div>
  )
}
