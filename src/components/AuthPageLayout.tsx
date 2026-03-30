import type { ReactNode } from 'react'
import { AuthThemeSwitcher } from './AuthThemeSwitcher'

type Props = {
  themeLabel: string
  /** e.g. "login", "signup" — used in the select id */
  idPrefix: string
  children: ReactNode
}

export function AuthPageLayout({ themeLabel, idPrefix, children }: Props) {
  return (
    <div className="auth-page">
      <header className="auth-page-bar">
        <AuthThemeSwitcher id={`${idPrefix}-theme`} label={themeLabel} />
      </header>
      <div className="auth-page-main">{children}</div>
    </div>
  )
}
