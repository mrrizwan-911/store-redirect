'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

/**
 * PWASplashScreen
 *
 * Full-screen branded splash shown on first load / while the app hydrates.
 * Design: matte black bg → bgless Calnza logo with gold shimmer → thin
 * animated progress bar → text tagline → fades out once ready.
 *
 * Usage: Import and render at the top of your store layout. It removes
 * itself from the DOM after the exit animation finishes.
 *
 * All text strings come from env vars so they never need code changes:
 *   NEXT_PUBLIC_APP_NAME          → "Calnza"
 *   NEXT_PUBLIC_APP_TAGLINE       → "Modern Boutique Essentials"
 */

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Calnza'
const APP_TAGLINE = process.env.NEXT_PUBLIC_APP_TAGLINE || 'Modern Boutique Essentials'
const LOGO_PATH = process.env.NEXT_PUBLIC_LOGO_PATH || '/bgless-logo.png'

export function PWASplashScreen() {
  const [phase, setPhase] = useState<'visible' | 'fading' | 'gone'>('visible')
  const [progress, setProgress] = useState(0)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Only show splash screen if the app is running in standalone mode (installed PWA)
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
    if (!checkStandalone) {
      setPhase('gone')
      return
    }

    setIsStandalone(true)

    // Animate the progress bar from 0 → 100 over ~1.8s
    let raf: number
    const start = performance.now()
    const duration = 1800

    function tick(now: number) {
      const elapsed = now - start
      const pct = Math.min(100, (elapsed / duration) * 100)
      setProgress(pct)

      if (pct < 100) {
        raf = requestAnimationFrame(tick)
      } else {
        // Hold at 100% briefly, then fade out
        setTimeout(() => setPhase('fading'), 300)
        setTimeout(() => setPhase('gone'), 1100)
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (phase === 'gone') return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0A0A0A',
        opacity: phase === 'fading' ? 0 : 1,
        transition: phase === 'fading' ? 'opacity 0.8s cubic-bezier(0.4,0,0.2,1)' : 'none',
        // Safe area support for iPhone notch / Dynamic Island
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* ── Logo with shimmer ── */}
      <div style={{ position: 'relative', width: 180, height: 180, marginBottom: 40 }}>
        {/* Glow halo behind logo */}
        <div
          style={{
            position: 'absolute',
            inset: -20,
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(184,152,100,0.18) 0%, rgba(184,152,100,0.04) 60%, transparent 80%)',
            animation: 'calnza-pulse 2.4s ease-in-out infinite',
          }}
        />

        {/* Bgless logo image */}
        <Image
          src={LOGO_PATH}
          alt={APP_NAME}
          width={180}
          height={180}
          priority
          style={{
            objectFit: 'contain',
            filter: 'brightness(1)',
            animation: 'calnza-logo-in 0.9s cubic-bezier(0.16,1,0.3,1) both',
          }}
        />

        {/* Shimmer sweep over logo */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(105deg, transparent 35%, rgba(255,220,150,0.35) 50%, transparent 65%)',
            backgroundSize: '200% 100%',
            animation: 'calnza-shimmer 2.2s ease-in-out infinite 0.6s',
            pointerEvents: 'none',
            borderRadius: 8,
          }}
        />
      </div>

      {/* ── Brand wordmark ── */}
      <div
        style={{
          fontFamily: 'var(--font-playfair, Georgia, serif)',
          fontSize: '1.5rem',
          fontWeight: 600,
          letterSpacing: '0.35em',
          color: '#FFFFFF',
          textTransform: 'uppercase',
          marginBottom: 8,
          animation: 'calnza-text-in 1s cubic-bezier(0.16,1,0.3,1) 0.3s both',
        }}
      >
        {APP_NAME}
      </div>

      {/* ── Tagline ── */}
      <div
        style={{
          fontFamily: 'var(--font-dm-sans, sans-serif)',
          fontSize: '0.6rem',
          fontWeight: 500,
          letterSpacing: '0.35em',
          color: 'rgba(184,152,100,0.8)',
          textTransform: 'uppercase',
          marginBottom: 56,
          animation: 'calnza-text-in 1s cubic-bezier(0.16,1,0.3,1) 0.5s both',
        }}
      >
        {APP_TAGLINE}
      </div>

      {/* ── Progress bar track ── */}
      <div
        style={{
          width: 120,
          height: 1,
          backgroundColor: 'rgba(255,255,255,0.08)',
          borderRadius: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Filled portion */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, rgba(184,152,100,0.6) 0%, rgba(220,190,130,1) 100%)',
            borderRadius: 1,
            transition: 'width 0.05s linear',
          }}
        />
        {/* Travelling gleam on top of filled bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            height: '100%',
            width: 30,
            background:
              'linear-gradient(90deg, transparent, rgba(255,240,200,0.9), transparent)',
            animation: 'calnza-bar-gleam 1.4s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── CSS keyframes injected via style tag ── */}
      <style>{`
        @keyframes calnza-logo-in {
          from { opacity: 0; transform: scale(0.88) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes calnza-text-in {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes calnza-pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.06); }
        }
        @keyframes calnza-shimmer {
          0%   { background-position: 200% 0; opacity: 0; }
          10%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { background-position: -200% 0; opacity: 0; }
        }
        @keyframes calnza-bar-gleam {
          0%   { left: -30px; opacity: 0; }
          20%  { opacity: 1; }
          100% { left: 120px; opacity: 0; }
        }
      `}</style>
    </div>
  )
}
