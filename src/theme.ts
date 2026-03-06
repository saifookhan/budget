export type ThemeId = 'neon' | 'warm' | 'black' | 'pink' | 'blue'

export const THEMES: { id: ThemeId; label: string }[] = [
  { id: 'neon', label: '✨ Neon pink' },
  { id: 'warm', label: '🌞 Warm' },
  { id: 'black', label: '🖤 Black' },
  { id: 'pink', label: '💗 Pink' },
  { id: 'blue', label: '💙 Blue' },
]

const VALID_THEMES: ThemeId[] = ['neon', 'warm', 'black', 'pink', 'blue']

const STORAGE_KEY = 'budget-theme'

export function getStoredTheme(): ThemeId {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v && VALID_THEMES.includes(v as ThemeId)) return v as ThemeId
  } catch {}
  return 'neon'
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
  neon: [
    '#ff2a6d', '#ff6b9d', '#ff8ab3', '#ff4d87', '#e91a5c',
    '#ff9ec4', '#ff3d7a', '#d41a5a', '#ff7aa8', '#ff5c8d',
    '#e84d7a', '#ffb3cc',
  ],
  warm: [
    '#c4a27b', '#a27f5a', '#8b6a4a', '#b68f68', '#d4b89a',
    '#9b7c63', '#7c6350', '#b39a82', '#8a7260', '#6d5a4a',
    '#a88c70', '#93745c',
  ],
  black: [
    '#7cb87c', '#6ba3d4', '#d4a574', '#c97b9e', '#9b8dc4',
    '#5eb5b5', '#e8b86d', '#7eb3e8', '#b8a06a', '#c49090',
    '#7ec4a0', '#b895c4',
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
