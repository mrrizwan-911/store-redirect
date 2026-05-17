'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, Settings2, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * CookieConsentBanner
 *
 * Placement: imported in root layout.tsx, rendered once globally.
 *
 * Behaviour:
 *  - Reads `consent_choice` cookie to decide whether to show.
 *  - If already set (user previously chose) → never shows.
 *  - On first visit → waits 2.5 seconds → slides up from bottom-left.
 *  - Two buttons only: "Manage Cookies" (necessary) and "Accept All".
 *  - No "Decline" button — the minimal option is "necessary only".
 *  - Saves choice to /api/cookie-consent which sets cookies server-side.
 *  - Dismisses with an exit animation on either button click.
 *  - Fully responsive: bottom-left on desktop, full-width bottom on mobile.
 *
 * Design:
 *  - White card, black border, rounded corners — matches store theme.
 *  - "Accept All" = black filled button (primary action).
 *  - "Manage Cookies" = white/outlined button (secondary action).
 *  - Small cookie icon + minimal copy.
 */

function getConsentCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)consent_choice=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

type ConsentType = 'all' | 'necessary'

export function CookieConsentBanner() {
  const [visible, setVisible]       = useState(false)
  const [saving,  setSaving]        = useState(false)
  const [done,    setDone]          = useState(false)
  const [choice,  setChoice]        = useState<ConsentType | null>(null)

  useEffect(() => {
    // Already consented — never show
    if (getConsentCookie()) return

    // Show after 2.5 seconds
    const timer = setTimeout(() => setVisible(true), 2500)
    return () => clearTimeout(timer)
  }, [])

  async function handleChoice(type: ConsentType) {
    if (saving) return

    setSaving(true)
    setChoice(type)

    try {
      await fetch('/api/cookie-consent', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type }),
      })
    } catch {
      // Consent save failed silently — still dismiss the banner
      // so the user is not stuck seeing it on every page
    } finally {
      setSaving(false)
      setDone(true)
      // Exit animation runs, then unmount
      setTimeout(() => setVisible(false), 400)
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="cookie-banner"
          // Slide up from below on enter, slide down on exit
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{    y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          // ── Positioning ──────────────────────────────────────────────────
          // Mobile  : fixed bottom-0 full-width, slight inset
          // Desktop : fixed bottom-6 left-6, max-w-sm card
          className={cn(
            'fixed z-[9999]',
            'bottom-0 left-0 right-0 md:bottom-6 md:left-6 md:right-auto',
            'mx-auto md:mx-0',
            'max-w-full md:max-w-sm',
          )}
          role="dialog"
          aria-label="Cookie consent"
          aria-live="polite"
        >
          <div
            className={cn(
              // Card shell
              'bg-white border border-neutral-200 shadow-2xl',
              // Mobile: no rounded top corners, full bleed
              'rounded-none md:rounded-2xl',
              // Desktop: rounded card
              'rounded-t-2xl md:rounded-2xl',
              // Padding
              'px-5 py-5 md:px-6 md:py-5',
            )}
          >
            {/* Header row */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 w-9 h-9 bg-black text-white rounded-full flex items-center justify-center mt-0.5">
                <Cookie className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-black mb-1">
                  We use cookies
                </p>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  We use cookies to personalise your experience and analyse how our
                  store is used. You can choose which cookies to allow.
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 mt-4">
              {/* Manage Cookies — necessary only */}
              <button
                onClick={() => handleChoice('necessary')}
                disabled={saving}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5',
                  'h-9 px-3 rounded-full border border-neutral-300',
                  'text-[10px] font-black uppercase tracking-widest text-black',
                  'hover:border-black hover:bg-neutral-50',
                  'transition-all duration-150 disabled:opacity-50',
                )}
              >
                {saving && choice === 'necessary'
                  ? <span className="w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" />
                  : <Settings2 className="w-3 h-3" />
                }
                Manage
              </button>

              {/* Accept All — primary action */}
              <button
                onClick={() => handleChoice('all')}
                disabled={saving}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5',
                  'h-9 px-3 rounded-full bg-black text-white',
                  'text-[10px] font-black uppercase tracking-widest',
                  'hover:bg-neutral-800 active:scale-[0.98]',
                  'transition-all duration-150 disabled:opacity-50',
                )}
              >
                {saving && choice === 'all'
                  ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  : <CheckCheck className="w-3 h-3" />
                }
                Accept All
              </button>
            </div>

            {/* Fine print */}
            <p className="text-[8px] text-neutral-300 text-center mt-3 leading-relaxed uppercase tracking-widest">
              By continuing to use our site, you agree to our{' '}
              <a href="/privacy-policy" className="underline hover:text-neutral-500 transition-colors">
                privacy policy
              </a>
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
