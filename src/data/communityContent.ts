/** IDs map to i18n keys `community.sharedTip{n}Title` / `...Body` and `community.forum*`. */

export const COMMUNITY_TIP_IDS = [1, 2, 3, 4] as const
export type CommunityTipId = (typeof COMMUNITY_TIP_IDS)[number]

export type ForumThreadId = 1 | 2 | 3 | 4 | 5 | 6

export const FORUM_CATEGORIES: readonly { id: 1 | 2 | 3; threadIds: readonly ForumThreadId[] }[] =
  [
    { id: 1, threadIds: [1, 2] },
    { id: 2, threadIds: [3, 4] },
    { id: 3, threadIds: [5, 6] },
  ]

const THREAD_TO_CAT: Record<ForumThreadId, 1 | 2 | 3> = {
  1: 1,
  2: 1,
  3: 2,
  4: 2,
  5: 3,
  6: 3,
}

export function forumCategoryIdForThread(threadId: ForumThreadId): 1 | 2 | 3 {
  return THREAD_TO_CAT[threadId]
}

export function parseForumThreadId(raw: string | undefined): ForumThreadId | null {
  const n = raw ? Number.parseInt(raw, 10) : NaN
  if (n >= 1 && n <= 6) return n as ForumThreadId
  return null
}
