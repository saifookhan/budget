import { supabase } from './supabase'
import { updateState } from './store'
import type { BudgetState } from './types'

const TABLE = 'budget_data'

export type FetchBudgetResult = { data: BudgetState | null; error: string | null }

/** Fetch budget state from Supabase for this user. */
export async function fetchBudgetState(userId: string): Promise<FetchBudgetResult> {
  if (!supabase) return { data: null, error: 'Supabase not configured' }
  const { data, error } = await supabase
    .from(TABLE)
    .select('data')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return { data: null, error: error.message }
  if (!data?.data) return { data: null, error: null }
  try {
    const parsed = data.data as BudgetState
    return { data: parsed, error: null }
  } catch {
    return { data: null, error: 'Invalid data' }
  }
}

/** Save budget state to Supabase for this user. Returns true if successful. */
export async function pushBudgetState(userId: string, state: BudgetState): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.from(TABLE).upsert(
    {
      user_id: userId,
      data: state,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )
  return !error
}

/** True if state has any real data (not default empty). */
export function hasBudgetData(state: BudgetState): boolean {
  return (
    (state.transactions?.length ?? 0) > 0 ||
    (state.monthlyIncome ?? 0) !== 0 ||
    (state.incomeByMonth && Object.keys(state.incomeByMonth).length > 0) ||
    (state.accounts?.length ?? 0) > 0 ||
    (state.categories?.length ?? 0) > 0 ||
    (state.recurring?.length ?? 0) > 0 ||
    (state.savingsGoals?.length ?? 0) > 0
  )
}

/** Replace local state with remote state (e.g. after login). Notifies subscribers. */
export function replaceLocalState(state: BudgetState): void {
  updateState(() => state)
}
