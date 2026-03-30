import { useState } from 'react'
import { supabase } from '../supabase'
import { AuthPageLayout } from '../components/AuthPageLayout'
import { LoginForm } from '../LoginForm'
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

export default function Login() {
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetLoading, setResetLoading] = useState(false)

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetError(null)
    if (!supabase || !resetEmail.trim()) return
    setResetLoading(true)
    try {
      const { error: e } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (e) setResetError(e.message)
      else setResetSent(true)
    } finally {
      setResetLoading(false)
    }
  }

  const notConfigured = !supabase

  const authLang = getAuthLang()
  const T = (key: string) => t(key, authLang)

  if (showForgotPassword) {
    return (
      <AuthPageLayout idPrefix="login-forgot" themeLabel={T('nav.theme')}>
        <div className="auth-card card">
          <h1 className="auth-title">{T('auth.resetPassword')}</h1>
          <p className="muted">
            {T('auth.resetPasswordSubtitle')}
          </p>

          {resetSent && (
            <div className="auth-alert auth-alert-success" role="status">
              {T('auth.checkEmail')}
            </div>
          )}

          {resetError && (
            <div className="auth-alert auth-alert-error" role="alert">
              {resetError}
            </div>
          )}

          {!resetSent ? (
            <form onSubmit={handleForgotSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="reset-email">{T('auth.email')}</label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder={T('auth.emailPlaceholder')}
                  required
                  disabled={notConfigured}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.25rem' }}
                disabled={resetLoading || notConfigured}
              >
                {resetLoading ? T('auth.sending') : T('auth.sendResetLink')}
              </button>
            </form>
          ) : null}

          <p className="auth-footer">
            <button
              type="button"
              className="btn-link"
              onClick={() => {
                setShowForgotPassword(false)
                setResetSent(false)
                setResetError(null)
              }}
            >
              {T('auth.backToLogin')}
            </button>
          </p>
        </div>
      </AuthPageLayout>
    )
  }

  return (
    <AuthPageLayout idPrefix="login" themeLabel={T('nav.theme')}>
      <div className="auth-card card">
        <LoginForm onForgotClick={() => setShowForgotPassword(true)} />
      </div>
    </AuthPageLayout>
  )
}
