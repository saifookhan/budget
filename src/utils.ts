const CURRENCY_LOCALES: Record<string, string> = {
  EUR: 'de-DE', USD: 'en-US', GBP: 'en-GB', CHF: 'de-CH', PLN: 'pl-PL',
  SEK: 'sv-SE', NOK: 'nb-NO', DKK: 'da-DK', JPY: 'ja-JP', CAD: 'en-CA', AUD: 'en-AU',
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  const locale = CURRENCY_LOCALES[currency] ?? 'en-US'
  const maxFrac = ['JPY', 'KRW'].includes(currency) ? 0 : 2
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFrac,
  }).format(amount)
}

export function getCurrentMonthKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function isCurrentMonth(dateStr: string): boolean {
  return dateStr.startsWith(getCurrentMonthKey())
}

export function getPreviousMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  if (m === 1) return `${y - 1}-12`
  return `${y}-${String(m - 1).padStart(2, '0')}`
}

/** Last N month keys including current, newest first */
export function getPastMonthKeys(count: number): string[] {
  const keys: string[] = []
  let key = getCurrentMonthKey()
  for (let i = 0; i < count; i++) {
    keys.push(key)
    key = getPreviousMonthKey(key)
  }
  return keys
}

export function isMonthKey(dateStr: string, monthKey: string): boolean {
  return dateStr.startsWith(monthKey)
}

export function monthYearLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  return d.toLocaleDateString('en-EU', { month: 'long', year: 'numeric' })
}
