import { describe, expect, it } from 'vitest'
import { formatDate, formatMoney } from './format'

describe('formatMoney', () => {
  it('formats a whole-unit salary with its currency and no decimals', () => {
    expect(formatMoney(125000, 'USD')).toBe('$125,000')
  })

  it('uses the currency symbol for non-USD currencies', () => {
    expect(formatMoney(1800000, 'INR')).toBe('₹1,800,000')
    expect(formatMoney(65000, 'EUR')).toBe('€65,000')
  })

  it('renders an em dash for missing values', () => {
    expect(formatMoney(null, 'USD')).toBe('—')
  })
})

describe('formatDate', () => {
  it('formats an ISO date without shifting it across time zones', () => {
    expect(formatDate('2022-04-01')).toBe('1 Apr 2022')
  })
})
