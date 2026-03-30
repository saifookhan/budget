/** IDs map to i18n keys `community.hiveTip{n}Title` / `...Body` and `community.story{n}*`. */

export const HIVE_TIP_IDS = [1, 2, 3, 4] as const
export type HiveTipId = (typeof HIVE_TIP_IDS)[number]

export const STORY_IDS = [1, 2, 3] as const
export type StoryId = (typeof STORY_IDS)[number]
