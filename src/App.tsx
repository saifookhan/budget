import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import Overview from './pages/Overview'
import Accounts from './pages/Accounts'
import Expenses from './pages/Spending'
import AllExpenses from './pages/AllExpenses'
import Subscriptions from './pages/Subscriptions'
import Savings from './pages/Savings'
import PastOverviews from './pages/PastOverviews'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ResetPassword from './pages/ResetPassword'
import HomePage from './pages/HomePage'
import ContactChat from './ContactChat'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { getStoredTheme, setStoredTheme, applyTheme, type ThemeId } from './theme'
import { getState, updateState, subscribe, subscribeToSave } from './store'
import {
  fetchBudgetState,
  pushBudgetState,
  replaceLocalState,
  hasBudgetData,
  getLastServerUpdatedAt,
  setLastServerUpdatedAt,
} from './budgetSync'
import debounce from 'lodash.debounce'
import { t } from './i18n'
import { LanguageProvider } from './LanguageContext'
import { UndoProvider } from './UndoContext'
import type { BudgetState, CurrencyCode, LanguageCode } from './types'

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
  const [serverConflictPending, setServerConflictPending] = useState<BudgetState | null>(null)
  const [serverConflictUpdatedAt, setServerConflictUpdatedAt] = useState<string | null>(null)
  const [refreshFromServerLoading, setRefreshFromServerLoading] = useState(false)
  const [refreshFromServerDone, setRefreshFromServerDone] = useState(false)
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

  // Sync: when logged in, fetch remote and use it as source of truth so all devices show the same data
  useEffect(() => {
    if (!user?.id) {
      setSyncDone(true)
      setSyncError(null)
      return
    }
    setSyncDone(false)
    setSyncError(null)
    setServerConflictPending(null)
    setServerConflictUpdatedAt(null)
    fetchBudgetState(user.id).then(({ data: remote, updated_at: serverUpdatedAt, error }) => {
      if (error) setSyncError(error)
      if (remote && hasBudgetData(remote)) {
        const last = getLastServerUpdatedAt(user.id)
        const localHasDataNow = hasBudgetData(getState())
        const serverNewer =
          serverUpdatedAt &&
          last &&
          new Date(serverUpdatedAt).getTime() > new Date(last).getTime()
        if (localHasDataNow && serverNewer) {
          setServerConflictPending(remote)
          setServerConflictUpdatedAt(serverUpdatedAt)
        } else {
          replaceLocalState(remote)
          if (serverUpdatedAt) setLastServerUpdatedAt(user.id, serverUpdatedAt)
        }
      } else if (remote && serverUpdatedAt) {
        setLastServerUpdatedAt(user.id, serverUpdatedAt)
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
    if (location.pathname === '/overview') setOverviewKey((k) => k + 1)
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
    if (syncDone) {
      const s = getState()
      setCurrency(s.currency)
      setLanguage(s.language ?? 'en')
    }
  }, [syncDone])

  const T = (key: string) => t(key, language)

  const handleRefreshFromServer = async () => {
    if (!user?.id) return
    setRefreshFromServerLoading(true)
    setRefreshFromServerDone(false)
    try {
      const { data: remote, updated_at: serverUpdatedAt } = await fetchBudgetState(user.id)
      if (remote && user.id) {
        replaceLocalState(remote)
        if (serverUpdatedAt) setLastServerUpdatedAt(user.id, serverUpdatedAt)
        setRefreshFromServerDone(true)
        setTimeout(() => setRefreshFromServerDone(false), 2500)
      }
    } finally {
      setRefreshFromServerLoading(false)
    }
  }

  const waitingForSync = user && !localHasData && !syncDone

  if (waitingForSync) {
    return (
      <div className="auth-page">
        <div className="auth-loading">{T('common.loadingBudget')}</div>
      </div>
    )
  }

  return (
    <LanguageProvider language={language}>
    <UndoProvider>
    <div className="app">
      {syncError && (
        <div className="sync-error-banner" role="alert">
          Could not load your budget from the cloud. {syncError.includes('exist') || syncError.includes('relation') ? 'Run the SQL in supabase_budget_table.sql in Supabase to enable sync.' : syncError}
          <button type="button" className="btn-link" onClick={() => setSyncError(null)} aria-label={T('common.dismiss')}>{T('common.dismiss')}</button>
        </div>
      )}
      {serverConflictPending && (
        <div className="sync-error-banner" role="alert" style={{ backgroundColor: 'var(--warning-bg, #fff3cd)', borderColor: 'var(--warning-border, #ffc107)', color: 'var(--text)' }}>
          {T('sync.updatedOnOtherDevice')}{' '}
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginLeft: '0.5rem' }}
            onClick={() => {
              if (serverConflictPending && serverConflictUpdatedAt && user?.id) {
                replaceLocalState(serverConflictPending)
                setLastServerUpdatedAt(user.id, serverConflictUpdatedAt)
                setServerConflictPending(null)
                setServerConflictUpdatedAt(null)
              }
            }}
          >
            {T('sync.reload')}
          </button>
        </div>
      )}
      {savedBannerVisible && (
        <div className="saved-banner" role="status" aria-live="polite">
          {T('nav.saved')}
        </div>
      )}
      <header className="app-header">
        <div className="hamburger-wrap">
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
        </div>
        <div className="header-actions">
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
          <NavLink
            to="/settings"
            className={({ isActive }) => `btn btn-icon header-settings-btn ${isActive ? 'active' : ''}`}
            aria-label={T('nav.settings')}
            title={T('nav.settings')}
          >
            <span aria-hidden>⚙️</span>
          </NavLink>
        </div>
      </header>
      <div
        className={`sidebar-overlay ${menuOpen && !sidebarsPinned ? 'sidebar-overlay-open' : ''}`}
        aria-hidden
        onClick={() => !sidebarsPinned && setMenuOpen(false)}
        aria-label="Close menu"
        role="button"
        tabIndex={-1}
      />
      <aside
        className={`sidebar-nav ${menuOpen ? 'sidebar-nav-open' : ''}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-nav-links">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => !sidebarsPinned && setMenuOpen(false)}>
            <span aria-hidden>🛒</span> {T('nav.expenses')}
          </NavLink>
          <NavLink to="/overview" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => !sidebarsPinned && setMenuOpen(false)}>
            <span aria-hidden>📊</span> {T('nav.overview')}
          </NavLink>
          <NavLink to="/accounts" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => !sidebarsPinned && setMenuOpen(false)}>
            <span aria-hidden>💰</span> {T('income.monthlyTitle')}
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
          <NavLink to="/past" className={({ isActive }) => (isActive ? 'active' : '')} onClick={() => !sidebarsPinned && setMenuOpen(false)}>
            <span aria-hidden>📅</span> {T('nav.past')}
          </NavLink>
        </div>
      </aside>
      <Routes>
        <Route path="/" element={<Expenses />} />
        <Route path="/overview" element={<Overview key={overviewKey} theme={theme} />} />
        <Route path="/income" element={<Navigate to="/accounts" replace />} />
        <Route path="/past" element={<PastOverviews />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/categories" element={<Navigate to="/" replace />} />
        <Route path="/spending" element={<Navigate to="/" replace />} />
        <Route path="/expenses-report" element={<AllExpenses />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/savings" element={<Savings />} />
        <Route
          path="/settings"
          element={
            <Settings
              theme={theme}
              setTheme={setTheme}
              currency={currency}
              onCurrencyChange={handleCurrencyChange}
              language={language}
              onLanguageChange={handleLanguageChange}
              user={user}
              onLogOut={() => signOut()}
              T={T}
              lastSyncedAt={user ? getLastServerUpdatedAt(user.id) : null}
              onRefreshFromServer={handleRefreshFromServer}
              refreshFromServerLoading={refreshFromServerLoading}
              refreshFromServerDone={refreshFromServerDone}
            />
          }
        />
      </Routes>
      <ContactChat open={contactOpen} onOpenChange={setContactOpen} />
    </div>
    </UndoProvider>
    </LanguageProvider>
  )
}

function HomeOrApp() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="auth-page">
        <div className="auth-loading">{t('common.loading', 'en')}</div>
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
