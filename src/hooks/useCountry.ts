'use client'

import { useState, useEffect } from 'react'
import { SITE_COUNTRY } from '@/lib/constants/site'

const COOKIE_NAME = 'calnza_country_pref'

export type CountryCode = 'PK' | 'UK' | 'GLOBAL'

/**
 * Get the effective country for the current user.
 * Priority:
 * 1. User's cookie preference (set from country selector)
 * 2. Domain-based default (NEXT_PUBLIC_SITE_COUNTRY env var)
 *
 * This is used for price display and currency formatting.
 */
export function getEffectiveCountry(): CountryCode {
  // Try cookie on client-side ( SSR-safe check - will default on server)
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';')
    const countryCookie = cookies.find(c => c.trim().startsWith(`${COOKIE_NAME}=`))
    if (countryCookie) {
      const value = countryCookie.split('=')[1]?.trim()
      if (value === 'PK' || value === 'UK' || value === 'GLOBAL') {
        return value as CountryCode
      }
    }
  }
  return (SITE_COUNTRY as CountryCode) || 'PK'
}

/**
 * Hook to get the effective country reactively.
 * This also listens for cookie changes (in case user switches country).
 */
export function useCountry(): { country: CountryCode; currency: string; symbol: string } {
  const [country, setCountry] = useState<CountryCode>(getEffectiveCountry())

  useEffect(() => {
    const checkCookieChange = () => {
      const newCountry = getEffectiveCountry()
      if (newCountry !== country) {
        setCountry(newCountry)
      }
    }

    // Check periodically (every 2 seconds) in case of cross-domain cookie changes
    const interval = setInterval(checkCookieChange, 2000)
    return () => clearInterval(interval)
  }, [country])

  const currency =
    country === 'PK' ? 'PKR' : country === 'UK' ? 'GBP' : 'USD'

  const symbol =
    country === 'PK' ? 'PKR' : country === 'UK' ? '£' : '$'

  return { country, currency, symbol }
}
