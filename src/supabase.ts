import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are safe to expose in the client:
// the anon key is designed for browser use; Row Level Security (RLS) ensures each
// user can only access their own budget_data. Do not use the service_role key in the client.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null
