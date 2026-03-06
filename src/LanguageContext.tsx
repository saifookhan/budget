import { createContext, useContext, useMemo } from 'react'
import { t } from './i18n'
import type { LanguageCode } from './types'

type LanguageContextValue = {
  language: LanguageCode
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({
  language,
  children,
}: {
  language: LanguageCode
  children: React.ReactNode
}) {
  const value = useMemo(
    () => ({ language, t: (key: string) => t(key, language) }),
    [language]
  )
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    return {
      language: 'en',
      t: (key: string) => t(key, 'en'),
    }
  }
  return ctx
}
