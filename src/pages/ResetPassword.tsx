import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../supabase'

export default function ResetPassword() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [checking, setChecking] = useState(true)

  const hasHash = typeof window !== 'undefined' && window.location.hash.length > 0

  useEffect(() => {
    const timer = setTimeout(() => setChecking(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (!supabase) return
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) setError(err.message)
      else {
        setDone(true)
        setTimeout(() => navigate('/', { replace: true }), 1500)
      }
    } finally {
      setLoading(false)
    }
  }

  const notConfigured = !supabase

  if (notConfigured) {
    return (
      <div className="auth-page">
        <div className="auth-card card">
          <h1 className="auth-title">Reset password</h1>
          <div className="auth-alert" role="alert">
            Supabase is not configured. Cannot reset password.
          </div>
          <p className="auth-footer">
            <Link to="/login">Back to login</Link>
          </p>
        </div>
      </div>
    )
  }

  if (checking) {
    return (
      <div className="auth-page">
        <div className="auth-card card">
          <p className="muted" style={{ margin: 0 }}>Loading…</p>
        </div>
      </div>
    )
  }

  if (!user && !hasHash) {
    return (
      <div className="auth-page">
        <div className="auth-card card">
          <h1 className="auth-title">Reset password</h1>
          <p className="muted">
            This link has expired or is invalid. Request a new reset link from the login page.
          </p>
          <p className="auth-footer">
            <Link to="/login">Back to login</Link>
          </p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card card">
          <h1 className="auth-title">Password updated</h1>
          <div className="auth-alert auth-alert-success" role="status">
            Your password has been updated. Redirecting you to the app…
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1 className="auth-title">Set new password</h1>
        <p className="muted">
          Enter your new password below.
        </p>

        {error && (
          <div className="auth-alert auth-alert-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="reset-new-password">New password</label>
            <input
              id="reset-new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="At least 6 characters"
            />
          </div>
          <div className="form-group">
            <label htmlFor="reset-confirm-password">Confirm password</label>
            <input
              id="reset-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.25rem' }}
            disabled={loading}
          >
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>

        <p className="auth-footer">
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  )
}
