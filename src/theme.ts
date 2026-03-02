export type ThemeId = 'warm' | 'black' | 'pink' | 'blue'

export const THEMES: { id: ThemeId; label: string }[] = [
  { id: 'warm', label: '🌞 Warm' },
  { id: 'black', label: '🖤 Black' },
  { id: 'pink', label: '💗 Pink' },
  { id: 'blue', label: '💙 Blue' },
]

const VALID_THEMES: ThemeId[] = ['warm', 'black', 'pink', 'blue']

const STORAGE_KEY = 'budget-theme'

export function getStoredTheme(): ThemeId {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v && VALID_THEMES.includes(v as ThemeId)) return v as ThemeId
  } catch {}
  return 'warm'
}

export function setStoredTheme(id: ThemeId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {}
}

export function applyTheme(id: ThemeId): void {
  document.documentElement.setAttribute('data-theme', id)
}

/** Chart segment colors per theme (for Overview spending-by-category chart).
 * All palettes are muted / soft (no bright neon colors).
 */
const CHART_COLORS_BY_THEME: Record<ThemeId, string[]> = {
  warm: [
    '#c4a27b', '#a27f5a', '#8b6a4a', '#b68f68', '#d4b89a',
    '#9b7c63', '#7c6350', '#b39a82', '#8a7260', '#6d5a4a',
    '#a88c70', '#93745c',
  ],
  black: [
    '#f0f0f0', '#d0d0d0', '#b0b0b0', '#a0a0a0', '#909090',
    '#808080', '#707070', '#606060', '#505050', '#e0e0e0',
    '#c0c0c0', '#989898',
  ],
  pink: [
    '#e9b4c8', '#d993b0', '#c46f92', '#b85f86', '#a65376',
    '#f3cad8', '#e0a7c0', '#c27b99', '#b06889', '#9b5879',
    '#d8b3cf', '#c494be',
  ],
  blue: [
    '#9cb8dd', '#88a7d3', '#6f8fbe', '#5f7ea8', '#4f6c92',
    '#c0d3ee', '#aabfdf', '#93a9cf', '#7d93be', '#667da9',
    '#506792', '#3f567f',
  ],
}

export function getChartColorsForTheme(themeId: ThemeId): string[] {
  return CHART_COLORS_BY_THEME[themeId] ?? CHART_COLORS_BY_THEME.warm
}
