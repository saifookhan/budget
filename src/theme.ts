export type ThemeId =
  | 'warm'
  | 'black'
  | 'pink'
  | 'blue'
  | 'purple'
  | 'yellowgreen'
  | 'fuchsia'
  | 'red'
  | 'brown'
  | 'tan'

export const THEMES: { id: ThemeId; label: string }[] = [
  { id: 'warm', label: 'Warm (default)' },
  { id: 'black', label: 'Black' },
  { id: 'pink', label: 'Pink' },
  { id: 'blue', label: 'Blue' },
  { id: 'purple', label: 'Purple' },
  { id: 'yellowgreen', label: 'Yellow green' },
  { id: 'fuchsia', label: 'Fuchsia' },
  { id: 'red', label: 'Red' },
  { id: 'brown', label: 'Brown' },
  { id: 'tan', label: 'Tan' },
]

const VALID_THEMES: ThemeId[] = [
  'warm', 'black', 'pink', 'blue', 'purple', 'yellowgreen', 'fuchsia', 'red', 'brown', 'tan',
]

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
