'use client'

import { useState, useEffect, useRef } from 'react'

export function useFlashSaleTimer(saleEndTimeUTC?: string | null) {
  // Initialize to a non-zero value so it doesn't default to expired before mount
  const getInitialTimeLeft = () => {
    if (!saleEndTimeUTC) return 0
    if (typeof window === 'undefined') return 1 // Server-side dummy value > 0
    return Math.max(0, new Date(saleEndTimeUTC).getTime() - Date.now())
  }

  const [timeLeft, setTimeLeft] = useState<number>(getInitialTimeLeft)
  const [isMounted, setIsMounted] = useState(false)
  const clockOffsetMs = useRef<number>(0)

  useEffect(() => {
    setIsMounted(true)
    fetch('/api/time')
      .then((r) => r.json())
      .then((data) => {
        if (data.serverTime) {
          clockOffsetMs.current = new Date(data.serverTime).getTime() - Date.now()
        }
      })
      .catch(() => {
        // Fall back to 0 offset on failure
        clockOffsetMs.current = 0
      })
  }, [])

  useEffect(() => {
    if (!saleEndTimeUTC) {
      setTimeLeft(0)
      return
    }

    const tick = () => {
      const correctedNow = Date.now() + clockOffsetMs.current
      const endMs = new Date(saleEndTimeUTC).getTime()
      setTimeLeft(Math.max(0, endMs - correctedNow))
    }

    tick() // Initial tick
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [saleEndTimeUTC])

  const hours = Math.floor(timeLeft / 3_600_000)
  const minutes = Math.floor((timeLeft % 3_600_000) / 60_000)
  const seconds = Math.floor((timeLeft % 60_000) / 1000)

  // Only declare expired if we're mounted AND time is 0.
  // This prevents UI flash/hide during SSR.
  const isExpired = !saleEndTimeUTC || (isMounted && timeLeft === 0)

  return { hours, minutes, seconds, isExpired, timeLeft, isMounted }
}
