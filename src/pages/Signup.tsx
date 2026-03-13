import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../supabase'
import { t } from '../i18n'
import type { LanguageCode } from '../types'

const BUDGET_STORAGE_KEY = 'budget-app-data'
function getAuthLang(): LanguageCode {
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

export default function Signup() {
  const { signUp, error, clearError } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    if (password !== confirmPassword) {
      clearError()
      return
    }
    setLoading(true)
    setSuccess(false)
    try {
      await signUp(email, password)
      setSuccess(true)
      navigate('/', { replace: true })
    } catch {
      // error is set by signUp
    } finally {
      setLoading(false)
    }
  }

  const notConfigured = !supabase
  const passwordsMatch = password === confirmPassword || confirmPassword === ''
  const authLang = getAuthLang()
  const T = (key: string) => t(key, authLang)

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1 className="auth-title">{T('auth.signUpTitle')}</h1>
        <p className="muted">
          {T('auth.signUpSubtitle')}
        </p>

        {notConfigured && (
          <div className="auth-alert" role="alert">
            Supabase is not configured. See <code>.env.example</code> and the README.
          </div>
        )}

        {error && !notConfigured && (
          <div className="auth-alert auth-alert-error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="auth-alert auth-alert-success" role="status">
            Account created. Check your email to confirm, then log in.
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="text"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={notConfigured}
            />
          </div>
          <div className="form-group">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={notConfigured}
            />
            <span className="muted" style={{ fontSize: '0.85rem' }}>
              {T('auth.passwordMinLength')}
            </span>
          </div>
          <div className="form-group">
            <label htmlFor="signup-confirm">{T('auth.confirmPassword')}</label>
            <input
              id="signup-confirm"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={notConfigured}
            />
            {!passwordsMatch && (
              <span className="auth-field-error">{T('auth.passwordsDontMatch')}</span>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading || notConfigured || !passwordsMatch}
          >
            {loading ? T('auth.creatingAccount') : T('auth.signUp')}
          </button>
        </form>

        <p className="auth-footer">
          {T('auth.alreadyHaveAccount')} <Link to="/login">{T('auth.logIn')}</Link>
        </p>
      </div>
    </div>
  )
}
