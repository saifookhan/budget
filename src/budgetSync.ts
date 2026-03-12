import { supabase } from './supabase'
import { updateState } from './store'
import type { BudgetState } from './types'

const TABLE = 'budget_data'
const LAST_SERVER_UPDATED_KEY = 'budget_last_server_updated'

export type FetchBudgetResult = {
  data: BudgetState | null
  updated_at: string | null
  error: string | null
}

/** Fetch budget state from Supabase for this user. */
export async function fetchBudgetState(userId: string): Promise<FetchBudgetResult> {
  if (!supabase) return { data: null, updated_at: null, error: 'Supabase not configured' }
  const { data, error } = await supabase
    .from(TABLE)
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return { data: null, updated_at: null, error: error.message }
  if (!data?.data) return { data: null, updated_at: data?.updated_at ?? null, error: null }
  try {
    const parsed = data.data as BudgetState
    const updatedAt = typeof data.updated_at === 'string' ? data.updated_at : null
    return { data: parsed, updated_at: updatedAt, error: null }
  } catch {
    return { data: null, updated_at: null, error: 'Invalid data' }
  }
}

/** Last server updated_at we know about (per user). Used to detect conflicts. */
export function getLastServerUpdatedAt(userId: string): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(`${LAST_SERVER_UPDATED_KEY}_${userId}`)
}

export function setLastServerUpdatedAt(userId: string, isoString: string): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(`${LAST_SERVER_UPDATED_KEY}_${userId}`, isoString)
}

/** Save budget state to Supabase for this user. Returns success and the written updated_at. */
export async function pushBudgetState(
  userId: string,
  state: BudgetState
): Promise<{ success: boolean; updated_at: string | null }> {
  if (!supabase) return { success: false, updated_at: null }
  const updatedAt = new Date().toISOString()
  const { error } = await supabase.from(TABLE).upsert(
    {
      user_id: userId,
      data: state,
      updated_at: updatedAt,
    },
    { onConflict: 'user_id' }
  )
  if (error) return { success: false, updated_at: null }
  setLastServerUpdatedAt(userId, updatedAt)
  return { success: true, updated_at: updatedAt }
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
  updateState(() => state, { silent: true })
}
