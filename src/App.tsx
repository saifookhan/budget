import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import Overview from './pages/Overview'
import Income from './pages/Income'
import Accounts from './pages/Accounts'
import Categories from './pages/Categories'
import Expenses from './pages/Spending'
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
import { getState, updateState, subscribe } from './store'
import { fetchBudgetState, pushBudgetState, replaceLocalState } from './budgetSync'
import debounce from 'lodash.debounce'
import { CURRENCIES, LANGUAGES } from './constants'
import { t } from './i18n'
import { LanguageProvider } from './LanguageContext'
import type { CurrencyCode, LanguageCode } from './types'

const MENU_STUCK_KEY = 'budget-menu-stuck'
const SETTINGS_STUCK_KEY = 'budget-settings-stuck'

function getMenuStuck(): boolean {
  return typeof localStorage !== 'undefined' && localStorage.getItem(MENU_STUCK_KEY) === '1'
}

function persistMenuStuck(value: boolean): void {
  localStorage.setItem(MENU_STUCK_KEY, value ? '1' : '0')
}

function getSettingsStuck(): boolean {
  if (typeof localStorage === 'undefined') return true
  const v = localStorage.getItem(SETTINGS_STUCK_KEY)
  return v !== '0'
}

function persistSettingsStuck(value: boolean): void {
  localStorage.setItem(SETTINGS_STUCK_KEY, value ? '1' : '0')
}

function AppShell() {
  const location = useLocation()
  const [theme, setTheme] = useState<ThemeId>(getStoredTheme())
  const initial = getState()
  const [currency, setCurrency] = useState<CurrencyCode>(initial.currency)
  const [language, setLanguage] = useState<LanguageCode>(initial.language ?? 'en')
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuStuck, setMenuStuckState] = useState(getMenuStuck)
  const [settingsOpen, setSettingsOpen] = useState(getSettingsStuck)
  const [settingsStuck, setSettingsStuckState] = useState(getSettingsStuck)
  const [overviewKey, setOverviewKey] = useState(0)
  const { user, signOut } = useAuth()

  // Sync budget to Supabase when logged in: load once on mount, then push on every change
  useEffect(() => {
    if (!user?.id) return
    fetchBudgetState(user.id).then((remote) => {
      if (remote && (remote.transactions?.length > 0 || remote.monthlyIncome !== 0 || (remote.accounts?.length ?? 0) > 0 || (remote.categories?.length ?? 0) > 0)) {
        replaceLocalState(remote)
      }
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

  const setMenuStuck = (value: boolean) => {
    setMenuStuckState(value)
    persistMenuStuck(value)
  }

  const setSettingsStuck = (value: boolean) => {
    setSettingsStuckState(value)
    persistSettingsStuck(value)
    if (value) setSettingsOpen(true)
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
    if (menuStuck) setMenuOpen(true)
  }, [])
  useEffect(() => {
    if (settingsStuck) setSettingsOpen(true)
  }, [])

  const T = (key: string) => t(key, language)

  const settingsVisible = settingsOpen || settingsStuck

  return (
    <LanguageProvider language={language}>
    <div className={`app ${settingsVisible ? 'app-settings-visible' : ''}`}>
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
          <NavLink to="/" onClick={() => !menuStuck && setMenuOpen(false)}>My Budget</NavLink>
        </h1>
        <button
          type="button"
          className="btn btn-icon sidebar-settings-toggle"
          onClick={() => setSettingsOpen((o) => !o)}
          aria-label={settingsOpen ? T('nav.closeSettings') : T('nav.settings')}
          aria-expanded={settingsOpen}
          title={settingsOpen ? T('nav.closeSettings') : T('nav.settings')}
        >
          <span aria-hidden>⚙️</span>
        </button>
      </header>
      <div
        className={`sidebar-overlay sidebar-overlay-right ${settingsOpen && !settingsStuck ? 'sidebar-overlay-open' : ''}`}
        aria-hidden
        onClick={() => setSettingsOpen(false)}
      />
      <aside
        className={`sidebar-settings ${settingsOpen || settingsStuck ? 'sidebar-settings-open' : ''}`}
        aria-label="Settings"
      >
        <div className="sidebar-settings-stick">
          <button
            type="button"
            className={`btn btn-ghost ${settingsStuck ? 'active' : ''}`}
            onClick={() => {
              const next = !settingsStuck
              setSettingsStuck(next)
              if (!next) setSettingsOpen(false)
            }}
            aria-pressed={settingsStuck}
            aria-label={settingsStuck ? T('nav.keepOpenOn') : T('nav.keepOpenOff')}
          >
            {settingsStuck ? `📌 ${T('nav.keepOpen')} ✓` : `📌 ${T('nav.keepOpen')}`}
          </button>
        </div>
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
      </aside>
      <div
        className={`sidebar-overlay ${menuOpen && !menuStuck ? 'sidebar-overlay-open' : ''}`}
        aria-hidden
      />
      <aside
        className={`sidebar-nav ${menuOpen ? 'sidebar-nav-open' : ''}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-nav-stick">
          <button
            type="button"
            className={`btn btn-ghost ${menuStuck ? 'active' : ''}`}
            onClick={() => setMenuStuck(!menuStuck)}
            aria-pressed={menuStuck}
            aria-label={menuStuck ? 'Keep menu open (on)' : 'Keep menu open (off)'}
          >
            {menuStuck ? `📌 ${T('nav.keepOpen')} ✓` : `📌 ${T('nav.keepOpen')}`}
          </button>
        </div>
        <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => !menuStuck && setMenuOpen(false)}>
          <span aria-hidden>📊</span> {T('nav.overview')}
        </NavLink>
        <NavLink to="/income" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => !menuStuck && setMenuOpen(false)}>
          <span aria-hidden>💰</span> {T('nav.income')}
        </NavLink>
        <NavLink to="/categories" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => !menuStuck && setMenuOpen(false)}>
          <span aria-hidden>📁</span> {T('nav.categories')}
        </NavLink>
        <NavLink to="/spending" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => !menuStuck && setMenuOpen(false)}>
          <span aria-hidden>🛒</span> {T('nav.expenses')}
        </NavLink>
        <NavLink to="/subscriptions" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => !menuStuck && setMenuOpen(false)}>
          <span aria-hidden>🔄</span> {T('nav.subscriptions')}
        </NavLink>
        <NavLink to="/savings" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => !menuStuck && setMenuOpen(false)}>
          <span aria-hidden>📈</span> {T('nav.savings')}
        </NavLink>
        <NavLink to="/accounts" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => !menuStuck && setMenuOpen(false)}>
          <span aria-hidden>🏦</span> {T('nav.wallet')}
        </NavLink>
        <NavLink to="/past" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => !menuStuck && setMenuOpen(false)}>
          <span aria-hidden>📅</span> {T('nav.past')}
        </NavLink>
      </aside>
      <Routes>
        <Route path="/" element={<Overview key={overviewKey} theme={theme} />} />
        <Route path="/income" element={<Income />} />
        <Route path="/past" element={<PastOverviews />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/spending" element={<Expenses />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/savings" element={<Savings />} />
      </Routes>
      <ContactChat />
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
