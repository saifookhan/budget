import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { useTranslation } from './LanguageContext'

type UndoContextValue = {
  showUndo: (restore: () => void) => void
}

const UndoContext = createContext<UndoContextValue | null>(null)

const UNDO_TOAST_MS = 5000

function UndoToast({ onUndo, onDismiss }: { onUndo: () => void; onDismiss: () => void }) {
  const { t } = useTranslation()
  return (
    <div
      className="undo-toast"
      role="status"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000,
      }}
    >
      <button type="button" className="btn btn-primary" onClick={onUndo}>
        {t('common.undo')}
      </button>
      <button type="button" className="btn btn-ghost" onClick={onDismiss} aria-label={t('common.dismiss')}>
        ×
      </button>
    </div>
  )
}

export function UndoProvider({ children }: { children: React.ReactNode }) {
  const [restore, setRestore] = useState<(() => void) | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearUndo = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setRestore(null)
  }, [])

  const showUndo = useCallback(
    (restoreFn: () => void) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setRestore(() => restoreFn)
      timeoutRef.current = setTimeout(clearUndo, UNDO_TOAST_MS)
    },
    [clearUndo]
  )

  const handleUndo = useCallback(() => {
    restore?.()
    clearUndo()
  }, [restore, clearUndo])

  return (
    <UndoContext.Provider value={{ showUndo }}>
      {children}
      {restore != null && (
        <UndoToast onUndo={handleUndo} onDismiss={clearUndo} />
      )}
    </UndoContext.Provider>
  )
}

export function useUndo(): UndoContextValue {
  const ctx = useContext(UndoContext)
  if (!ctx) throw new Error('useUndo must be used within UndoProvider')
  return ctx
}
