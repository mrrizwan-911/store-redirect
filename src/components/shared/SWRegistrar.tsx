'use client'

import { useEffect } from 'react'

/**
 * SWRegistrar
 *
 * Lightweight client component placed once in the root layout.
 * Registers /sw.js after the page has fully hydrated so it never
 * blocks the initial render or causes SSR mismatches.
 *
 * This component renders nothing to the DOM.
 */
export function SWRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(reg => {
          // Check for updates every 60 minutes when the page is visible
          setInterval(() => {
            if (document.visibilityState === 'visible') {
              reg.update().catch(() => {/* non-fatal */})
            }
          }, 60 * 60 * 1000)
        })
        .catch(err => {
          // Non-fatal — app still works without SW
          console.warn('[SW] Registration failed:', err)
        })
    })
  }, [])

  return null
}
