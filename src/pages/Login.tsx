import { useState } from 'react'
import { supabase } from '../supabase'
import { LoginForm } from '../LoginForm'

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

  if (showForgotPassword) {
    return (
      <div className="auth-page">
        <div className="auth-card card">
          <h1 className="auth-title">Reset password</h1>
          <p className="muted">
            Enter your email and we’ll send you a link to reset your password.
          </p>

          {resetSent && (
            <div className="auth-alert auth-alert-success" role="status">
              Check your email for the reset link.
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
                <label htmlFor="reset-email">Email</label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@example.com"
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
                {resetLoading ? 'Sending…' : 'Send reset link'}
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
              Back to login
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <LoginForm onForgotClick={() => setShowForgotPassword(true)} />
      </div>
    </div>
  )
}
