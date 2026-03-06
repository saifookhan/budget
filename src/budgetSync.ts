import { supabase } from './supabase'
import { updateState } from './store'
import type { BudgetState } from './types'

const TABLE = 'budget_data'

/** Fetch budget state from Supabase for this user. Returns null if no row or error. */
export async function fetchBudgetState(userId: string): Promise<BudgetState | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from(TABLE)
    .select('data')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data?.data) return null
  try {
    const parsed = data.data as BudgetState
    return parsed
  } catch {
    return null
  }
}

/** Save budget state to Supabase for this user. */
export async function pushBudgetState(userId: string, state: BudgetState): Promise<void> {
  if (!supabase) return
  await supabase.from(TABLE).upsert(
    {
      user_id: userId,
      data: state,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )
}

/** Replace local state with remote state (e.g. after login). Notifies subscribers. */
export function replaceLocalState(state: BudgetState): void {
  updateState(() => state)
}
