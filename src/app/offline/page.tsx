/**
 * src/app/offline/page.tsx
 *
 * Shown by the service worker when the user tries to navigate to any page
 * while offline and no cached version is available.
 *
 * The SW pre-caches this page at install time (listed in PRECACHE_ASSETS
 * in sw.js) so it is ALWAYS available offline.
 */
import Image from 'next/image'
import Link from 'next/link'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Calnza'
const LOGO_PATH = process.env.NEXT_PUBLIC_LOGO_PATH || '/bgless-logo.png'

export const metadata = {
  title: `You're Offline | ${APP_NAME}`,
  robots: { index: false, follow: false },
}

export default function OfflinePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: '#0A0A0A', color: '#FFFFFF' }}
    >
      {/* Logo */}
      <div className="relative w-24 h-24 mb-10 opacity-60">
        <Image
          src={LOGO_PATH}
          alt={APP_NAME}
          fill
          style={{ objectFit: 'contain' }}
          priority
        />
      </div>

      {/* Wordmark */}
      <p className="font-display text-2xl tracking-[0.3em] uppercase text-white mb-3">
        {APP_NAME}
      </p>

      {/* Tagline */}
      <p
        className="text-[10px] uppercase tracking-[0.35em] mb-12"
        style={{ color: 'rgba(184,152,100,0.8)' }}
      >
        {process.env.NEXT_PUBLIC_APP_TAGLINE || 'Modern Boutique Essentials'}
      </p>

      {/* Message */}
      <h1 className="text-xl font-display font-medium text-white/80 mb-3">
        You&apos;re offline
      </h1>
      <p className="text-sm text-white/40 max-w-xs leading-relaxed mb-10 font-sans">
        Check your internet connection and try again. Your cart and wishlist are saved.
      </p>

      {/* Retry button */}
      <a
        href=""
        className="px-10 py-3 border border-white/20 text-white/80 text-xs uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all duration-500 inline-block"
      >
        Try Again
      </a>

      {/* Back link */}
      <Link
        href="/"
        className="mt-6 text-[11px] uppercase tracking-widest text-white/30 hover:text-white transition-colors"
      >
        ← Back to Store
      </Link>
    </div>
  )
}
