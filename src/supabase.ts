import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are safe to expose in the client:
// the anon key is designed for browser use; Row Level Security (RLS) ensures each
// user can only access their own budget_data. Do not use the service_role key in the client.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

const KEEP_LOGGED_IN_KEY = 'budget_keep_logged_in'

/** Storage that uses localStorage when "keep me logged in" is on, sessionStorage when off. */
function getAuthStorage(): Storage {
  const preferPersistent =
    typeof localStorage !== 'undefined' && localStorage.getItem(KEEP_LOGGED_IN_KEY) !== 'false'
  return preferPersistent ? localStorage : sessionStorage
}

const authStorage: Storage = {
  getItem: (key: string) => getAuthStorage().getItem(key),
  setItem: (key: string, value: string) => getAuthStorage().setItem(key, value),
  removeItem: (key: string) => {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(key)
    if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(key)
  },
  get length() {
    return getAuthStorage().length
  },
  key: (index: number) => getAuthStorage().key(index),
  clear: () => {
    if (typeof localStorage !== 'undefined') localStorage.clear()
    if (typeof sessionStorage !== 'undefined') sessionStorage.clear()
  },
}

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: { storage: authStorage, persistSession: true },
      })
    : null

/** Call before sign-in to set whether the session should persist (localStorage) or be session-only (sessionStorage). */
export function setKeepLoggedIn(keep: boolean): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(KEEP_LOGGED_IN_KEY, keep ? 'true' : 'false')
  }
}
