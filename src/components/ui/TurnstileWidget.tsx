'use client'

import { useEffect, useRef, useCallback } from 'react'

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void
  onExpire?: () => void
  onError?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact'
  appearance?: 'always' | 'execute' | 'interaction-only'
}

declare global {
  interface Window {
    turnstile: {
      render: (el: HTMLElement, options: object) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
    onTurnstileLoad?: () => void
  }
}

/**
 * Cloudflare Turnstile CAPTCHA widget.
 * Usage:
 *   <TurnstileWidget onSuccess={(token) => setToken(token)} />
 * Then POST the token to your API, and verify server-side with verifyTurnstile().
 */
export function TurnstileWidget({
  onSuccess,
  onExpire,
  onError,
  theme = 'light',
  size = 'normal',
  appearance = 'always',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef  = useRef<string | null>(null)

  const renderWidget = useCallback(() => {
    if (!containerRef.current || !window.turnstile) return

    // Remove existing widget before re-rendering
    if (widgetIdRef.current) {
      window.turnstile.remove(widgetIdRef.current)
      widgetIdRef.current = null
    }

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || '',
      theme,
      size,
      appearance,
      callback: onSuccess,
      'expired-callback': onExpire,
      'error-callback': onError,
    })
  }, [onSuccess, onExpire, onError, theme, size, appearance])

  useEffect(() => {
    // If Turnstile is already loaded, render immediately
    if (window.turnstile) {
      renderWidget()
      return
    }

    // Otherwise inject the script once and render on load
    if (!document.getElementById('cf-turnstile-script')) {
      window.onTurnstileLoad = renderWidget
      const script = document.createElement('script')
      script.id  = 'cf-turnstile-script'
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    } else {
      // Script already injected but Turnstile not yet ready — set callback
      window.onTurnstileLoad = renderWidget
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
    }
  }, [renderWidget])

  return (
    <div
      ref={containerRef}
      className="turnstile-container"
      style={{ minHeight: size === 'compact' ? 60 : 70 }}
    />
  )
}
