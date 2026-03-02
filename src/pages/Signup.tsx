import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../supabase'

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

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <h1 className="auth-title">Sign up</h1>
        <p className="muted">
          Create an account to use the budget app.
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
              At least 6 characters
            </span>
          </div>
          <div className="form-group">
            <label htmlFor="signup-confirm">Confirm password</label>
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
              <span className="auth-field-error">Passwords don’t match</span>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading || notConfigured || !passwordsMatch}
          >
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}
