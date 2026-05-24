'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { SITE_COUNTRY } from '@/lib/constants/site'

interface CountrySelectorProps {
  detectedCountry?: string | null
}

// ─── Cookie helpers (no dependency on js-cookie) ────────────────────────────
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

// ─── Site config ─────────────────────────────────────────────────────────────
const SITE_CONFIG = {
  PK: {
    name: 'Pakistan',
    domain: 'https://calnza.pk',
    siteLabel: 'Pakistan',
  },
  UK: {
    name: 'United Kingdom',
    domain: 'https://calnza.co.uk',
    siteLabel: 'United Kingdom',
  },
}

const DISMISSED_COOKIE = 'calnza_country_dismissed'
const CHOICE_COOKIE    = 'calnza_country_pref'

export function CountrySelector({ detectedCountry }: CountrySelectorProps) {
  const [open, setOpen] = useState(false)

  // Determine if there is a mismatch between detected and current site
  const current   = SITE_COUNTRY === 'UK' ? 'UK' : 'PK'
  const detected  = detectedCountry === 'GB' || detectedCountry === 'UK' ? 'UK' : 'PK'
  const mismatch  = current !== detected

  const detectedConfig = SITE_CONFIG[detected]
  const currentConfig  = SITE_CONFIG[current]

  useEffect(() => {
    if (!mismatch) return
    const dismissed = getCookie(DISMISSED_COOKIE)
    const choice    = getCookie(CHOICE_COOKIE)
    if (dismissed || choice) return

    // Small delay so the page loads first
    const t = setTimeout(() => setOpen(true), 900)
    return () => clearTimeout(t)
  }, [mismatch])

  const stay = () => {
    setCookie(DISMISSED_COOKIE, 'true', 7)
    setCookie(CHOICE_COOKIE, current, 365)
    setOpen(false)
  }

  const redirect = () => {
    setCookie(CHOICE_COOKIE, detected, 365)
    window.location.href = detectedConfig.domain
  }

  if (!open) return null

  return (
    <>
      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      <div
        className="fixed inset-0 z-[998] bg-black/40 backdrop-blur-[2px]"
        onClick={stay}
        aria-hidden="true"
      />

      {/* ── Card ─────────────────────────────────────────────────────────── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Location suggestion"
        className={[
          'fixed z-[999]',
          // Mobile: sits above the bottom-nav bar
          'bottom-20 left-4 right-4',
          // Desktop: centered
          'sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[420px]',
          'bg-white rounded-2xl shadow-2xl px-7 py-8',
          'animate-in fade-in slide-in-from-bottom-4 duration-300',
        ].join(' ')}
      >
        {/* Close */}
        <button
          onClick={stay}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Text */}
        <p className="text-sm font-bold tracking-widest uppercase text-black mb-3">
          Hello,
        </p>
        <p className="text-sm text-neutral-700 leading-relaxed mb-7">
          We think you are in{' '}
          <strong className="text-black font-semibold">
            {detectedConfig.name}
          </strong>
          . Update your location?
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          {/* Stay = dark pill */}
          <button
            onClick={stay}
            className="w-full py-3.5 bg-black text-white text-xs font-bold tracking-widest uppercase rounded-full hover:bg-neutral-800 transition-colors"
          >
            No, stay on {currentConfig.siteLabel}
          </button>

          {/* Switch = outline pill */}
          <button
            onClick={redirect}
            className="w-full py-3.5 bg-white text-black text-xs font-bold tracking-widest uppercase rounded-full border border-black hover:bg-neutral-50 transition-colors"
          >
            Yes, go to the {detectedConfig.siteLabel} site
          </button>
        </div>
      </div>
    </>
  )
}
