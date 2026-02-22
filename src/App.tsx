import { useState, useEffect } from 'react'
import { Routes, Route, NavLink } from 'react-router-dom'
import Overview from './pages/Overview'
import Income from './pages/Income'
import Accounts from './pages/Accounts'
import Categories from './pages/Categories'
import Spending from './pages/Spending'
import Subscriptions from './pages/Subscriptions'
import Savings from './pages/Savings'
import { THEMES, getStoredTheme, setStoredTheme, applyTheme, type ThemeId } from './theme'

function App() {
  const [theme, setTheme] = useState<ThemeId>(getStoredTheme())

  useEffect(() => {
    applyTheme(theme)
    setStoredTheme(theme)
  }, [theme])

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          <NavLink to="/">My Budget</NavLink>
        </h1>
        <label className="theme-dropdown-label">
          <span className="theme-dropdown-visual">Theme</span>
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
      </header>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/income" element={<Income />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/spending" element={<Spending />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/savings" element={<Savings />} />
      </Routes>

      <nav className="nav" aria-label="Main">
        <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span aria-hidden>📊</span> Overview
        </NavLink>
        <NavLink to="/income" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span aria-hidden>💰</span> Income
        </NavLink>
        <NavLink to="/accounts" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span aria-hidden>🏦</span> Accounts
        </NavLink>
        <NavLink to="/categories" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span aria-hidden>📁</span> Categories
        </NavLink>
        <NavLink to="/spending" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span aria-hidden>🛒</span> Spending
        </NavLink>
        <NavLink to="/subscriptions" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span aria-hidden>🔄</span> Subscriptions
        </NavLink>
        <NavLink to="/savings" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span aria-hidden>📈</span> Savings
        </NavLink>
      </nav>
    </div>
  )
}

export default App
