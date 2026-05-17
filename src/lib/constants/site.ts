/**
 * Site configuration — determined at build/runtime by NEXT_PUBLIC_SITE_COUNTRY env var.
 *
 * Set in .env.local:
 *   NEXT_PUBLIC_SITE_COUNTRY=PK   → calnza.pk
 *   NEXT_PUBLIC_SITE_COUNTRY=UK   → calnza.co.uk
 *   NEXT_PUBLIC_SITE_COUNTRY=GLOBAL → calnza.com
 *
 * Default: PK (for the current single deployment)
 */

export type SiteCountry = 'PK' | 'UK' | 'GLOBAL'

export const SITE_COUNTRY: SiteCountry =
  (process.env.NEXT_PUBLIC_SITE_COUNTRY as SiteCountry) || 'PK'

/**
 * Payment methods enabled per country.
 * Components for disabled methods still exist in code — they just don't render.
 * This makes it safe to copy the full codebase to all 3 deployments.
 */
export const ENABLED_PAYMENT_METHODS: Record<SiteCountry, string[]> = {
  PK: ['COD', 'CARD', 'EASYPAISA'],
  UK: ['CARD'],
  GLOBAL: ['CARD'],
}

export const SITE_CURRENCY: Record<SiteCountry, string> = {
  PK: 'PKR',
  UK: 'GBP',
  GLOBAL: 'USD',
}

export const SITE_CURRENCY_SYMBOL: Record<SiteCountry, string> = {
  PK: 'PKR',
  UK: '£',
  GLOBAL: '$',
}

/** Stripe: PKR is zero-decimal. GBP/USD need *100. */
export const STRIPE_AMOUNT_MULTIPLIER: Record<SiteCountry, number> = {
  PK: 1,
  UK: 100,
  GLOBAL: 100,
}

export function getEnabledPaymentMethods(): string[] {
  return ENABLED_PAYMENT_METHODS[SITE_COUNTRY] ?? ['CARD']
}

export function getCurrency(): string {
  return SITE_CURRENCY[SITE_COUNTRY] ?? 'PKR'
}

export function getCurrencySymbol(): string {
  return SITE_CURRENCY_SYMBOL[SITE_COUNTRY] ?? 'PKR'
}

export function formatPrice(amount: number): string {
  const symbol = getCurrencySymbol()
  if (SITE_COUNTRY === 'PK') {
    return `${symbol} ${amount.toLocaleString()}`
  }
  return `${symbol}${amount.toFixed(2)}`
}
