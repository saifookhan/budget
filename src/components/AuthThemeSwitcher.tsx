import { useEffect, useState } from 'react'
import { THEMES, getStoredTheme, setStoredTheme, applyTheme, type ThemeId } from '../theme'

type Props = {
  id: string
  label: string
}

export function AuthThemeSwitcher({ id, label }: Props) {
  const [theme, setTheme] = useState<ThemeId>(() => getStoredTheme())

  useEffect(() => {
    applyTheme(theme)
    setStoredTheme(theme)
  }, [theme])

  return (
    <div className="auth-theme-switch">
      <label htmlFor={id} className="auth-theme-switch-label">
        {label}
      </label>
      <select
        id={id}
        className="theme-dropdown auth-theme-switch-select"
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemeId)}
        aria-label={label}
      >
        {THEMES.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
