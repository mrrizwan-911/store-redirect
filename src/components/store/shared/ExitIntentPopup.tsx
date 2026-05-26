'use client'

import { useEffect, useState, useRef } from 'react'
import { X, Loader2, CircleCheck } from 'lucide-react'
import { TurnstileWidget } from '@/components/ui/TurnstileWidget'

const STORAGE_KEY = 'calnza_exit_popup_seen'
const MIN_TIME_ON_PAGE_MS = 3000   // must be on page ≥ 3 seconds before popup can show
const MOBILE_IDLE_MS      = 45000  // mobile: show after 45s of inactivity

/**
 * ExitIntentPopup
 * ─────────────────────────────────────────────────────
 * Desktop: fires when cursor moves toward top of browser (exit intent).
 * Mobile:  fires after MOBILE_IDLE_MS of no scroll/touch activity.
 * Only shows ONCE per browser session (localStorage flag).
 * Subscribes the email to /api/newsletter/subscribe.
 */
export function ExitIntentPopup() {
  const [visible, setVisible]         = useState(false)
  const [email, setEmail]             = useState('')
  const [isLoading, setIsLoading]     = useState(false)
  const [isSuccess, setIsSuccess]     = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState('')

  const hasShownRef   = useRef(false)
  const mountTimeRef  = useRef(Date.now())
  const idleTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  const canShow = () => {
    if (hasShownRef.current) return false
    if (typeof window === 'undefined') return false
    if (localStorage.getItem(STORAGE_KEY)) return false
    if (Date.now() - mountTimeRef.current < MIN_TIME_ON_PAGE_MS) return false
    return true
  }

  const show = () => {
    if (!canShow()) return
    hasShownRef.current = true
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(true)
  }

  useEffect(() => {
    // ── Desktop exit intent ──
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) show()
    }

    // ── Mobile idle intent ──
    const resetIdleTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      idleTimerRef.current = setTimeout(show, MOBILE_IDLE_MS)
    }

    // Only set up mobile idle on touch devices
    const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window

    document.addEventListener('mouseleave', handleMouseLeave)

    if (isTouchDevice) {
      resetIdleTimer()
      window.addEventListener('scroll', resetIdleTimer, { passive: true })
      window.addEventListener('touchstart', resetIdleTimer, { passive: true })
    }

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('scroll', resetIdleTimer)
      window.removeEventListener('touchstart', resetIdleTimer)
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    if (!turnstileToken) {
      setError('Please complete the security verification.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'EXIT_POPUP', turnstileToken }),
      })
      const data = await res.json()

      if (data.success) {
        setIsSuccess(true)
        setTurnstileToken('')
        setTimeout(() => setVisible(false), 2500)
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!visible) return null

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: 'rgba(26, 22, 20, 0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) setVisible(false) }}
    >
      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-none bg-[#FAF7F2] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-500"
        style={{ maxHeight: '90vh' }}
      >
        {/* Close */}
        <button
          onClick={() => setVisible(false)}
          className="absolute top-4 right-4 z-10 p-2 text-neutral-400 hover:text-black transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Decorative accent bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #C8A96E 0%, #A07840 100%)' }} />

        <div className="px-8 py-10 sm:px-10 sm:py-12">
          {isSuccess ? (
            /* Success state */
            <div className="flex flex-col items-center text-center gap-6 py-4">
              <CircleCheck className="w-14 h-14 text-black stroke-[1]" />
              <div className="space-y-2">
                <h2 className="font-display text-2xl font-medium tracking-tight">You&apos;re in!</h2>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Check your inbox for your exclusive 10% off code.
                </p>
              </div>
            </div>
          ) : (
            /* Default state */
            <>
              <p className="text-[10px] uppercase tracking-[0.4em] text-neutral-400 font-bold mb-4">
                Wait — before you go
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-tight leading-tight mb-3">
                Get 10% off your first order
              </h2>
              <p className="text-neutral-500 text-sm leading-relaxed mb-8">
                Join the Calnza inner circle for exclusive access to new arrivals, private sales, and your welcome discount.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Your email address"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full h-12 border-b-2 border-neutral-200 bg-transparent text-sm placeholder:text-neutral-400 focus:outline-none focus:border-black transition-colors duration-300 pr-4"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-500">{error}</p>
                )}

                <TurnstileWidget
                  size="compact"
                  onSuccess={setTurnstileToken}
                  onExpire={() => setTurnstileToken('')}
                  onError={() => setTurnstileToken('')}
                />

                <button
                  type="submit"
                  disabled={isLoading || !turnstileToken}
                  className="w-full h-12 bg-black text-white text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-neutral-900 transition-colors duration-300 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Claim My 10% Off'
                  )}
                </button>
              </form>

              <button
                onClick={() => setVisible(false)}
                className="mt-4 w-full text-[10px] uppercase tracking-[0.2em] text-neutral-400 hover:text-black transition-colors text-center"
              >
                No thanks, I&apos;ll pay full price
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
