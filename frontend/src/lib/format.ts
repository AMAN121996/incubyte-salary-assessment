const moneyFormatters = new Map<string, Intl.NumberFormat>()

export function formatMoney(amount: number | null | undefined, currency: string): string {
  if (amount === null || amount === undefined) return '—'

  let formatter = moneyFormatters.get(currency)
  if (!formatter) {
    formatter = new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 0,
    })
    moneyFormatters.set(currency, formatter)
  }
  return formatter.format(amount)
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

// Dates are calendar dates (YYYY-MM-DD); format in UTC so they never shift a day.
export function formatDate(isoDate: string): string {
  return dateFormatter.format(new Date(`${isoDate}T00:00:00Z`))
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en')
}
