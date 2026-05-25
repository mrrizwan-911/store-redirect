/**
 * Currency helpers for Calnza multi-region store.
 * Reads from user cookie first, then falls back to SITE_COUNTRY.
 *
 * Order.country values: "pk" | "uk" | "global"
 * Cookie: calnza_country_pref
 *
 * region param (from cookie > analytics header > env var):
 *   "pk"  → PKR formatting, PK prices
 *   "uk"  → GBP formatting, UK prices
 *   "global" → USD formatting, UK prices (Global inherits UK)
 */

export type Region = 'pk' | 'uk' | 'global' | string

const COOKIE_NAME = 'calnza_country_pref'

/** Get effective country from env var to ensure consistency across server and client */
function getCountryCode(): string {
  return (process.env.NEXT_PUBLIC_SITE_COUNTRY || 'PK').toLowerCase()
}

/** Currency symbol only */
export function currencySymbol(region?: Region): string {
  const r = region || getCountryCode()
  if (r === 'uk') return '£'
  if (r === 'global') return '$'
  return 'PKR'
}

/** Full formatted amount — now dynamically uses effective country */
export function formatCurrency(amount: number, region?: Region): string {
  const r = (region || getCountryCode()).toLowerCase()

  if (r === 'uk') {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (r === 'global' || r === 'usd') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Default: PKR
  return `PKR ${new Intl.NumberFormat('en-PK', {
    maximumFractionDigits: 0,
  }).format(amount)}`
}

/**
 * formatPrice — convenience alias used across storefront
 * Dynamically formats based on effective country (cookie > env)
 */
export function formatPrice(amount: number | null): string {
  if (amount == null) return ''

  const r = getCountryCode()

  if (r === 'uk') {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount)
  }

  if (r === 'global') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
  }).format(amount)
}

/** Compact: 1.2M, 45K etc. */
export function formatCurrencyCompact(amount: number, region?: Region): string {
  const r = (region || getCountryCode()).toLowerCase()

  if (amount >= 1_000_000) {
    if (r === 'uk') return `£${(amount / 1_000_000).toFixed(1)}M`
    if (r === 'global') return `$${(amount / 1_000_000).toFixed(1)}M`
    return `PKR ${(amount / 1_000_000).toFixed(1)}M`
  }
  if (amount >= 1_000) {
    if (r === 'uk') return `£${(amount / 1_000).toFixed(0)}K`
    if (r === 'global') return `$${(amount / 1_000).toFixed(0)}K`
    return `PKR ${(amount / 1_000).toFixed(0)}K`
  }
  return formatCurrency(amount, r)
}

/** For Recharts YAxis tickFormatter — no symbol prefix on small screens */
export function chartCurrencyFormatter(value: number, region?: Region): string {
  const r = (region || getCountryCode()).toLowerCase()
  if (value >= 1_000_000)
    return r === 'uk' ? `£${(value / 1_000_000).toFixed(1)}M` : r === 'global' ? `$${(value / 1_000_000).toFixed(1)}M` : `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)
    return r === 'uk' ? `£${(value / 1_000).toFixed(0)}K` : r === 'global' ? `$${(value / 1_000).toFixed(0)}K` : `${(value / 1_000).toFixed(0)}K`
  return r === 'uk' ? `£${value}` : r === 'global' ? `$${value}` : `${value}`
}

/** Determine which price fields to use based on effective country */
export function getPriceFields() {
  const r = getCountryCode()
  if (r === 'uk' || r === 'global') {
    return { price: 'priceUK', salePrice: 'salePriceUK', currency: 'GBP' }
  }
  return { price: 'pricePK', salePrice: 'salePricePK', currency: 'PKR' }
}
