import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom'
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

function shellPageHeading(pathname: string, T: (key: string) => string): string {
  switch (pathname) {
    case '/':
      return T('expenses.title')
    case '/overview':
      return T('overview.title')
    case '/accounts':
      return T('accounts.pageTitle')
    case '/past':
      return T('past.title')
    case '/expenses-report':
      return T('expensesReport.title')
    case '/subscriptions':
      return T('subscriptions.title')
    case '/savings':
      return T('savings.title')
    case '/settings':
      return T('nav.settings')
    default:
      return T('expenses.title')
  }
}

function AppShell() {
  const location = useLocation()
  const navigate = useNavigate()
  const [theme, setTheme] = useState<ThemeId>(getStoredTheme())
  const initial = getState()
  const [currency, setCurrency] = useState<CurrencyCode>(initial.currency)
  const [language, setLanguage] = useState<LanguageCode>(initial.language ?? 'en')
  const [overviewKey, setOverviewKey] = useState(0)
  const [syncDone, setSyncDone] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [savedBannerVisible, setSavedBannerVisible] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [serverConflictPending, setServerConflictPending] = useState<BudgetState | null>(null)
  const [serverConflictUpdatedAt, setServerConflictUpdatedAt] = useState<string | null>(null)
  const [refreshFromServerLoading, setRefreshFromServerLoading] = useState(false)
  const [refreshFromServerDone, setRefreshFromServerDone] = useState(false)
  const [refreshFromServerError, setRefreshFromServerError] = useState<string | null>(null)
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
    setRefreshFromServerError(null)
    try {
      const { data: remote, updated_at: serverUpdatedAt, error: fetchError } = await fetchBudgetState(user.id)
      if (fetchError) {
        setRefreshFromServerError(fetchError)
        return
      }
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

  function isLikelyNetworkFetchError(msg: string): boolean {
    const m = msg.toLowerCase()
    return m.includes('failed to fetch') || m.includes('networkerror') || m.includes('load failed') || m.includes('network request failed')
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
      {typeof navigator !== 'undefined' && !navigator.onLine && !syncError && (
        <div className="sync-error-banner" role="status" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          {T('sync.offline')}
        </div>
      )}
      {syncError && (
        <div className="sync-error-banner" role="alert">
          Could not load your budget from the cloud.{' '}
          {syncError.includes('exist') || syncError.includes('relation')
            ? 'Run the SQL in supabase_budget_table.sql in Supabase to enable sync.'
            : syncError}
          {isLikelyNetworkFetchError(syncError) && (
            <span className="muted" style={{ display: 'block', marginTop: '0.35rem', fontSize: '0.9rem' }}>
              {T('sync.fetchFailedHint')}
            </span>
          )}
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
        <div className="app-title">
          <span className="app-header-page-name">{shellPageHeading(location.pathname, T)}</span>
        </div>
        <div className="header-actions" aria-label={T('nav.quickActions')}>
          <NavLink
            to="/settings"
            className={({ isActive }) => `header-settings-link${isActive ? ' active' : ''}`}
            aria-label={T('nav.settings')}
            title={T('nav.settings')}
          >
            <span className="header-chat-emoji" aria-hidden>
              ⚙️
            </span>
            <span className="header-chat-tagline">{T('nav.settings')}</span>
          </NavLink>
          <button
            type="button"
            className={`header-chat-block${contactOpen ? ' active' : ''}`}
            onClick={() => setContactOpen((o) => !o)}
            aria-label={T('contact.open')}
            aria-expanded={contactOpen}
            title={T('contact.open')}
          >
            <span className="header-chat-emoji" aria-hidden>
              💬
            </span>
            <span className="header-chat-tagline">{T('contact.headerTagline')}</span>
          </button>
        </div>
      </header>
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
              refreshFromServerError={refreshFromServerError}
              dismissRefreshError={() => setRefreshFromServerError(null)}
              isOffline={typeof navigator !== 'undefined' && !navigator.onLine}
            />
          }
        />
      </Routes>
      <nav className="app-bottom-nav" aria-label={T('nav.bottomNav')}>
        <NavLink to="/overview" className={({ isActive }) => `app-bottom-nav-item${isActive ? ' active' : ''}`}>
          <span className="app-bottom-nav-icon" aria-hidden>📊</span>
          <span className="app-bottom-nav-label">{T('nav.overview')}</span>
        </NavLink>
        <NavLink to="/accounts" className={({ isActive }) => `app-bottom-nav-item${isActive ? ' active' : ''}`}>
          <span className="app-bottom-nav-icon" aria-hidden>💰</span>
          <span className="app-bottom-nav-label">{T('accounts.title')}</span>
        </NavLink>
        <NavLink to="/subscriptions" className={({ isActive }) => `app-bottom-nav-item${isActive ? ' active' : ''}`}>
          <span className="app-bottom-nav-icon" aria-hidden>🔄</span>
          <span className="app-bottom-nav-label">{T('nav.subscriptions')}</span>
        </NavLink>
        <NavLink to="/savings" className={({ isActive }) => `app-bottom-nav-item${isActive ? ' active' : ''}`}>
          <span className="app-bottom-nav-icon" aria-hidden>📈</span>
          <span className="app-bottom-nav-label">{T('nav.savings')}</span>
        </NavLink>
        <button
          type="button"
          className="app-bottom-nav-item app-bottom-nav-item--btn"
          onClick={() => navigate('/', { state: { focusAdd: true } })}
          aria-label={T('expenses.bottomNavNewExpense')}
        >
          <span className="app-bottom-nav-icon" aria-hidden>➕</span>
          <span className="app-bottom-nav-label">{T('expenses.bottomNavNewExpense')}</span>
        </button>
      </nav>
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
