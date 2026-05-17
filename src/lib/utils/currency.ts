/**
 * Currency formatter for Calnza multi-region store.
 *
 * Order.country values: "pk" | "uk" | "both"
 *
 * region param (from analytics header selection):
 *   "pk"  → PKR formatting
 *   "uk"  → GBP formatting
 *   "all" → uses PKR as default (you can change to a dual display if needed)
 */

export type Region = 'pk' | 'uk' | 'all' | 'both' | string

/** Currency symbol only */
export function currencySymbol(region?: Region): string {
  return region === 'uk' ? '£' : 'PKR'
}

/** Full formatted amount */
export function formatCurrency(amount: number, region?: Region): string {
  if (region === 'uk') {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Default: PKR
  return `PKR ${new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 0,
  }).format(amount)}`
}

/** Compact: 1.2M, 45K etc. */
export function formatCurrencyCompact(amount: number, region?: Region): string {
  if (amount >= 1_000_000) {
    return region === 'uk'
      ? `£${(amount / 1_000_000).toFixed(1)}M`
      : `PKR ${(amount / 1_000_000).toFixed(1)}M`
  }
  if (amount >= 1_000) {
    return region === 'uk'
      ? `£${(amount / 1_000).toFixed(0)}K`
      : `PKR ${(amount / 1_000).toFixed(0)}K`
  }
  return formatCurrency(amount, region)
}

/** For Recharts YAxis tickFormatter — no symbol prefix on small screens */
export function chartCurrencyFormatter(value: number, region?: Region): string {
  if (value >= 1_000_000)
    return region === 'uk' ? `£${(value / 1_000_000).toFixed(1)}M` : `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)
    return region === 'uk' ? `£${(value / 1_000).toFixed(0)}K` : `${(value / 1_000).toFixed(0)}K`
  return region === 'uk' ? `£${value}` : `${value}`
}
