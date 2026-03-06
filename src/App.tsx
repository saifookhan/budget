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
import { AuthProvider, useAuth } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { THEMES, getStoredTheme, setStoredTheme, applyTheme, type ThemeId } from './theme'
import { getState, updateState } from './store'
import { CURRENCIES, LANGUAGES } from './constants'
import { t } from './i18n'
import { LanguageProvider } from './LanguageContext'
import type { CurrencyCode, LanguageCode } from './types'

const MENU_STUCK_KEY = 'budget-menu-stuck'

function getMenuStuck(): boolean {
  return typeof localStorage !== 'undefined' && localStorage.getItem(MENU_STUCK_KEY) === '1'
}

function persistMenuStuck(value: boolean): void {
  localStorage.setItem(MENU_STUCK_KEY, value ? '1' : '0')
}

function AppShell() {
  const location = useLocation()
  const [theme, setTheme] = useState<ThemeId>(getStoredTheme())
  const initial = getState()
  const [currency, setCurrency] = useState<CurrencyCode>(initial.currency)
  const [language, setLanguage] = useState<LanguageCode>(initial.language ?? 'en')
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuStuck, setMenuStuckState] = useState(getMenuStuck)
  const [overviewKey, setOverviewKey] = useState(0)
  const { user, signOut } = useAuth()

  useEffect(() => {
    if (location.pathname === '/') setOverviewKey((k) => k + 1)
  }, [location.pathname])

  const setMenuStuck = (value: boolean) => {
    setMenuStuckState(value)
    persistMenuStuck(value)
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

  const T = (key: string) => t(key, language)

  return (
    <LanguageProvider language={language}>
    <div className="app">
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
      </header>
      <aside className="sidebar-settings" aria-label="Settings">
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
    </div>
    </LanguageProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password" element={<ResetPassword />} />
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
