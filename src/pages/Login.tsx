import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../supabase'

export default function Login() {
  const { signIn, error, clearError } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetLoading, setResetLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/', { replace: true })
    } finally {
      setLoading(false)
    }
  }

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
        <h1 className="auth-title">Log in</h1>
        <p className="muted">
          Use your email and password to access your budget.
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
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={notConfigured}
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={notConfigured}
            />
            <p style={{ marginTop: '0.35rem', marginBottom: 0 }}>
              <button
                type="button"
                className="btn-link"
                onClick={() => {
                  clearError()
                  setShowForgotPassword(true)
                }}
              >
                Forgot password?
              </button>
            </p>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.25rem' }}
            disabled={loading || notConfigured}
          >
            {loading ? 'Signing in…' : 'Log in'}
          </button>
        </form>

        <p className="auth-footer">
          Don’t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
