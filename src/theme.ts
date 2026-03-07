export type ThemeId = 'neonBlack' | 'neonRainbow' | 'neonClear'

export const THEMES: { id: ThemeId; label: string }[] = [
  { id: 'neonBlack', label: '✨ Neon black' },
  { id: 'neonRainbow', label: '🌈 Neon rainbow' },
  { id: 'neonClear', label: '☀️ Neon clear' },
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
    '#ff2a6d', '#ff6b9d', '#ff8ab3', '#ff4d87', '#e91a5c',
    '#ff9ec4', '#ff3d7a', '#d41a5a', '#ff7aa8', '#ff5c8d',
    '#e84d7a', '#ffb3cc',
  ],
  neonRainbow: [
    '#ff2a6d', '#00f5d4', '#fee440', '#9b5de5', '#00bbf9',
    '#ff6b9d', '#00e5c0', '#f9c74f', '#c77dff', '#48cae4',
    '#ff8ab3', '#94d2bd',
  ],
  neonClear: [
    '#ff2a6d', '#ff6b9d', '#ff8ab3', '#ff4d87', '#e91a5c',
    '#ff9ec4', '#ff3d7a', '#d41a5a', '#ff7aa8', '#ff5c8d',
    '#e84d7a', '#ffb3cc',
  ],
}

export function getChartColorsForTheme(themeId: ThemeId): string[] {
  return CHART_COLORS_BY_THEME[themeId] ?? CHART_COLORS_BY_THEME.neonBlack
}
