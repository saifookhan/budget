import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../supabase'
import debounce from "lodash.debounce";

type AuthState = {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      setLoading(false)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setError(null)
    if (!supabase) {
      setError('Supabase is not configured. See .env.example and the setup guide.')
      return
    }
    const { error: e } = await supabase.auth.signInWithPassword({ email, password })
    if (e) setError(e.message)
  }

  const debouncedSignUp = debounce(async (email: string, password: string) => {
    setError(null);
    if (!supabase) {
      setError("Supabase is not configured. See .env.example and the setup guide.");
      return;
    }
    const { error: e } = await supabase.auth.signUp({ email, password });
    if (e) setError(e.message);
    else setError(null);
  }, 1000);

  const signUp = async (email: string, password: string) => {
    await debouncedSignUp(email, password);
  }

  const signOut = async () => {
    setError(null)
    if (supabase) await supabase.auth.signOut()
  }

  const clearError = () => setError(null)

  const value: AuthState = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
