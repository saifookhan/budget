import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import Overview from './pages/Overview'
import Income from './pages/Income'
import Accounts from './pages/Accounts'
import Categories from './pages/Categories'
import Expenses from './pages/Spending'
import AllExpenses from './pages/AllExpenses'
import Subscriptions from './pages/Subscriptions'
import Savings from './pages/Savings'
import PastOverviews from './pages/PastOverviews'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ResetPassword from './pages/ResetPassword'
import HomePage from './pages/HomePage'
import ContactChat from './ContactChat'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { THEMES, getStoredTheme, setStoredTheme, applyTheme, type ThemeId } from './theme'
import { getState, updateState, subscribe, subscribeToSave } from './store'
import { fetchBudgetState, pushBudgetState, replaceLocalState, hasBudgetData } from './budgetSync'
import debounce from 'lodash.debounce'
import { CURRENCIES, LANGUAGES } from './constants'
import { t } from './i18n'
import { LanguageProvider } from './LanguageContext'
import type { CurrencyCode, LanguageCode } from './types'

const SIDEBARS_PINNED_KEY = 'budget-sidebars-pinned'

function getSidebarsPinned(): boolean {
  if (typeof localStorage === 'undefined') return false
  const v = localStorage.getItem(SIDEBARS_PINNED_KEY)
  if (v !== null) return v === '1'
  const menu = localStorage.getItem('budget-menu-stuck')
  const settings = localStorage.getItem('budget-settings-stuck')
  if (menu === null && settings === null) return false
  return menu === '1' || settings !== '0'
}

function persistSidebarsPinned(value: boolean): void {
  localStorage.setItem(SIDEBARS_PINNED_KEY, value ? '1' : '0')
}

function AppShell() {
  const location = useLocation()
  const [theme, setTheme] = useState<ThemeId>(getStoredTheme())
  const initial = getState()
  const [currency, setCurrency] = useState<CurrencyCode>(initial.currency)
  const [language, setLanguage] = useState<LanguageCode>(initial.language ?? 'en')
  const [menuOpen, setMenuOpen] = useState(false)
  const [sidebarsPinned, setSidebarsPinnedState] = useState(getSidebarsPinned)
  const [overviewKey, setOverviewKey] = useState(0)
  const [syncDone, setSyncDone] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [savedBannerVisible, setSavedBannerVisible] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const { user, signOut } = useAuth()

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>
    const unsub = subscribeToSave(() => {
      setSavedBannerVisible(true)
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => setSavedBannerVisible(false), 2500)
    })
    return () => {
      unsub()
      clearTimeout(timeoutId)
    }
  }, [])

  const localHasData = hasBudgetData(getState())

  // Sync: when logged in, fetch remote; if local is empty we replace with remote so you don't see 0
  useEffect(() => {
    if (!user?.id) {
      setSyncDone(true)
      setSyncError(null)
      return
    }
    setSyncDone(false)
    setSyncError(null)
    fetchBudgetState(user.id).then(({ data: remote, error }) => {
      if (error) setSyncError(error)
      if (remote && hasBudgetData(remote)) {
        const local = getState()
        if (!hasBudgetData(local)) replaceLocalState(remote)
      }
      setSyncDone(true)
    })
    const push = debounce(() => {
      pushBudgetState(user.id, getState())
    }, 800)
    const unsub = subscribe(() => push())
    return () => {
      unsub()
      push.cancel()
    }
  }, [user?.id])

  useEffect(() => {
    if (location.pathname === '/') setOverviewKey((k) => k + 1)
  }, [location.pathname])

  const setSidebarsPinned = (value: boolean) => {
    setSidebarsPinnedState(value)
    persistSidebarsPinned(value)
    if (value) {
      setMenuOpen(true)
    } else {
      setMenuOpen(false)
    }
  }

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value as CurrencyCode
    setCurrency(code)
    updateState((s) => ({ ...s, currency: code }))
  }

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value as LanguageCode
    setLanguage(code)
    updateState((s) => ({ ...s, language: code }))
  }

  useEffect(() => {
    applyTheme(theme)
    setStoredTheme(theme)
  }, [theme])

  useEffect(() => {
    if (sidebarsPinned) {
      setMenuOpen(true)
    }
  }, [])

  useEffect(() => {
    if (syncDone) {
      const s = getState()
      setCurrency(s.currency)
      setLanguage(s.language ?? 'en')
    }
  }, [syncDone])

  const T = (key: string) => t(key, language)

  const waitingForSync = user && !localHasData && !syncDone

  if (waitingForSync) {
    return (
      <div className="auth-page">
        <div className="auth-loading">Loading your budget…</div>
      </div>
    )
  }

  return (
    <LanguageProvider language={language}>
    <div className="app">
      {syncError && (
        <div className="sync-error-banner" role="alert">
          Could not load your budget from the cloud. {syncError.includes('exist') || syncError.includes('relation') ? 'Run the SQL in supabase_budget_table.sql in Supabase to enable sync.' : syncError}
          <button type="button" className="btn-link" onClick={() => setSyncError(null)} aria-label="Dismiss">Dismiss</button>
        </div>
      )}
      {savedBannerVisible && (
        <div className="saved-banner" role="status" aria-live="polite">
          {T('nav.saved')}
        </div>
      )}
      <header className="app-header">
        <button
          type="button"
          className="btn btn-icon hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span className="hamburger-lines" aria-hidden>
            <span />
            <span />
            <span />
          </span>
        </button>
        <h1 className="app-title" style={{ margin: 0, flex: '1 1 auto', minWidth: 0 }}>
          <NavLink to="/" onClick={() => !sidebarsPinned && setMenuOpen(false)}>My Budget</NavLink>
        </h1>
        <button
          type="button"
          className={`btn btn-icon sidebar-pin-btn ${sidebarsPinned ? 'active' : ''}`}
          onClick={() => setSidebarsPinned(!sidebarsPinned)}
          aria-pressed={sidebarsPinned}
          aria-label={sidebarsPinned ? T('nav.keepOpenOn') : T('nav.keepOpenOff')}
          title={sidebarsPinned ? T('nav.keepOpenOn') : T('nav.keepOpenOff')}
        >
          <span aria-hidden>{sidebarsPinned ? '📌✓' : '📌'}</span>
        </button>
        <NavLink
          to="/spending"
          state={{ focusAdd: true }}
          className="btn btn-icon header-add-expense-btn"
          aria-label={T('expenses.addExpense')}
          title={T('expenses.addExpense')}
        >
          <span aria-hidden>+</span>
        </NavLink>
        <button
          type="button"
          className={`btn btn-icon header-chat-btn ${contactOpen ? 'active' : ''}`}
          onClick={() => setContactOpen((o) => !o)}
          aria-label={T('contact.open')}
          aria-expanded={contactOpen}
          title={T('contact.open')}
        >
          <span aria-hidden>💬</span>
        </button>
        </header>
      <div
        className={`sidebar-overlay ${menuOpen && !sidebarsPinned ? 'sidebar-overlay-open' : ''}`}
        aria-hidden
      />
      <aside
        className={`sidebar-nav ${menuOpen ? 'sidebar-nav-open' : ''}`}
        aria-label="Main navigation"
      >
        <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => !sidebarsPinned && setMenuOpen(false)}>
          <span aria-hidden>📊</span> {T('nav.overview')}
        </NavLink>
        <NavLink to="/income" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => !sidebarsPinned && setMenuOpen(false)}>
          <span aria-hidden>💰</span> {T('nav.income')}
        </NavLink>
        <NavLink to="/categories" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => !sidebarsPinned && setMenuOpen(false)}>
          <span aria-hidden>📁</span> {T('nav.categories')}
        </NavLink>
        <NavLink to="/spending" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => !sidebarsPinned && setMenuOpen(false)}>
          <span aria-hidden>🛒</span> {T('nav.expenses')}
        </NavLink>
        <NavLink to="/expenses-report" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => !sidebarsPinned && setMenuOpen(false)}>
          <span aria-hidden>📋</span> {T('nav.allExpenses')}
        </NavLink>
        <NavLink to="/subscriptions" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => !sidebarsPinned && setMenuOpen(false)}>
          <span aria-hidden>🔄</span> {T('nav.subscriptions')}
        </NavLink>
        <NavLink to="/savings" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => !sidebarsPinned && setMenuOpen(false)}>
          <span aria-hidden>📈</span> {T('nav.savings')}
        </NavLink>
        <NavLink to="/accounts" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => !sidebarsPinned && setMenuOpen(false)}>
          <span aria-hidden>🏦</span> {T('nav.wallet')}
        </NavLink>
        <NavLink to="/past" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => !sidebarsPinned && setMenuOpen(false)}>
          <span aria-hidden>📅</span> {T('nav.past')}
        </NavLink>
        <div className="sidebar-nav-options">
          <label className="theme-dropdown-label">
            <span className="theme-dropdown-visual">{T('nav.theme')}</span>
            <select
              className="theme-dropdown"
              value={theme}
              onChange={(e) => setTheme(e.target.value as ThemeId)}
              aria-label="Change color scheme"
            >
              {THEMES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className="theme-dropdown-label">
            <span className="theme-dropdown-visual">{T('nav.currency')}</span>
            <select
              className="theme-dropdown"
              value={currency}
              onChange={handleCurrencyChange}
              aria-label="Change currency"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </label>
          <label className="theme-dropdown-label">
            <span className="theme-dropdown-visual">{T('nav.language')}</span>
            <select
              className="theme-dropdown"
              value={language}
              onChange={handleLanguageChange}
              aria-label="Change language"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
              ))}
            </select>
          </label>
          {user && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => signOut()}
              style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}
            >
              {T('nav.logOut')}
            </button>
          )}
        </div>
      </aside>
      <Routes>
        <Route path="/" element={<Overview key={overviewKey} theme={theme} />} />
        <Route path="/income" element={<Income />} />
        <Route path="/past" element={<PastOverviews />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/spending" element={<Expenses />} />
        <Route path="/expenses-report" element={<AllExpenses />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/savings" element={<Savings />} />
      </Routes>
      <ContactChat open={contactOpen} onOpenChange={setContactOpen} />
    </div>
    </LanguageProvider>
  )
}

function HomeOrApp() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-loading">Loading…</div>
      </div>
    )
  }
  if (!user) return <HomePage />
  return <AppShell />
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/" element={<HomeOrApp />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
