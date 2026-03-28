export type ThemeId = 'neonBlack' | 'neonRainbow' | 'neonClear'

export const THEMES: { id: ThemeId; label: string }[] = [
  { id: 'neonBlack', label: '🍷 Wine night' },
  { id: 'neonRainbow', label: '💗 Magenta' },
  { id: 'neonClear', label: '☀️ Crème' },
]

const VALID_THEMES: ThemeId[] = ['neonBlack', 'neonRainbow', 'neonClear']

const STORAGE_KEY = 'budget-theme'

export function getStoredTheme(): ThemeId {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v && VALID_THEMES.includes(v as ThemeId)) return v as ThemeId
    if (v === 'neon' || v === 'black' || v === 'warm' || v === 'pink' || v === 'blue') return 'neonBlack'
  } catch {}
  return 'neonBlack'
}

export function setStoredTheme(id: ThemeId): void {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch {}
}

export function applyTheme(id: ThemeId): void {
  document.documentElement.setAttribute('data-theme', id)
}

const CHART_COLORS_BY_THEME: Record<ThemeId, string[]> = {
  neonBlack: [
    '#8c1c5b', '#5a0f2e', '#c9a96e', '#6d1548', '#d6a5b5',
    '#4a0d27', '#b89268', '#7a2848', '#9b4d72', '#dcc598',
    '#621838', '#a67d8c', '#b07a90',
  ],
  neonRainbow: [
    '#8c1c5b', '#621838', '#5a0f2e', '#c9a96e', '#9b4d72',
    '#6d1548', '#d6a5b5', '#a08050', '#541530', '#7a2848',
    '#b89268', '#a67d8c',
  ],
  neonClear: [
    '#8c1c5b', '#5a0f2e', '#6d1548', '#c9a96e', '#d6a5b5',
    '#621838', '#b89268', '#7a2848', '#9b4d72', '#4a0c24',
    '#dcc598', '#a67d8c', '#b07a90',
  ],
}

export function getChartColorsForTheme(themeId: ThemeId): string[] {
  return CHART_COLORS_BY_THEME[themeId] ?? CHART_COLORS_BY_THEME.neonBlack
}
