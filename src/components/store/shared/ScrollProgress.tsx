'use client'

import { useEffect, useState } from 'react'
import { ChevronUp } from 'lucide-react'

/**
 * ScrollProgress
 * ─────────────────────────────────────────────────────
 * • Renders a thin warm-gold progress bar at the very top of the viewport
 *   (above Navbar, z-[200]) that fills as the user scrolls down the page.
 * • Adds a back-to-top button that appears after 400px of scroll.
 * • Zero external dependencies beyond React.
 * • Adds a subtle engagement loop — users subconsciously track their progress.
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0)
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      setProgress(pct)
      setShowBackToTop(scrollTop > 400)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* ── Thin progress bar ── */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 z-[200] h-[2px] pointer-events-none"
        style={{ backgroundColor: 'transparent' }}
      >
        <div
          className="h-full transition-[width] duration-100 ease-linear"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #C8A96E 0%, #A07840 100%)',
          }}
        />
      </div>

      {/* ── Back to top button ── */}
      <button
        onClick={scrollToTop}
        aria-label="Back to top"
        className={[
          'fixed bottom-6 right-6 z-[150] w-10 h-10 rounded-full',
          'bg-black text-white shadow-lg flex items-center justify-center',
          'transition-all duration-500',
          showBackToTop
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none',
          // On mobile, keep above WhatsApp button (which is usually bottom-right)
          'sm:bottom-8 sm:right-8',
          // Shift left slightly on mobile so it doesn't overlap the WhatsApp float
          'mr-14 sm:mr-0',
        ].join(' ')}
      >
        <ChevronUp className="w-4 h-4 stroke-[2]" />
      </button>
    </>
  )
}
