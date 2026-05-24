import type { Metadata, Viewport } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { ReduxProvider } from '@/components/shared/ReduxProvider'
import { FloatingWhatsApp } from '@/components/store/shared/FloatingWhatsApp'
import { CartDrawer } from '@/components/store/cart/CartDrawer'
import { SWRegistrar } from '@/components/shared/SWRegistrar'
import { ScrollProgress } from '@/components/store/shared/ScrollProgress'
import { ExitIntentPopup } from '@/components/store/shared/ExitIntentPopup'
import { SocialProofToast } from '@/components/store/shared/SocialProofToast'

// ─── Fonts ───────────────────────────────────────────────────────────────────
const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
})

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
  display: 'swap',
})

// ─── App config from env ────────────────────────────────────────────────────
const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://calnza.pk'
const APP_URL   = rawAppUrl.startsWith('http') ? rawAppUrl : `https://${rawAppUrl}`
const APP_NAME  = process.env.NEXT_PUBLIC_APP_NAME || 'Calnza'
const SITE_COUNTRY = process.env.NEXT_PUBLIC_SITE_COUNTRY || 'PK'

// Per-region descriptions and keywords
const REGION_META: Record<string, { description: string; keywords: string[]; title: string }> = {
  PK: {
    title: 'Calnza — Luxury Pakistani Fashion Online',
    description: 'Shop premium Pakistani apparel, embroidered suits, and luxury pret at Calnza.pk. Pay with EasyPaisa, COD, or card. Free delivery available.',
    keywords: ['Pakistani fashion', 'Pakistani clothes online', 'embroidered suits', 'lawn suits', 'pret wear', 'luxury kurta', 'calnza', 'ladies clothes Pakistan'],
  },
  UK: {
    title: 'Calnza — Pakistani Fashion in the UK',
    description: 'Shop authentic Pakistani luxury fashion delivered to the UK. Embroidered suits, lawn collections and formal wear. Secure GBP checkout.',
    keywords: ['Pakistani fashion UK', 'Asian clothes UK', 'embroidered suits UK', 'Pakistani dresses London', 'calnza uk', 'south asian fashion'],
  },
  GLOBAL: {
    title: 'Calnza — Luxury South Asian Fashion',
    description: 'Shop premium South Asian fashion worldwide. Embroidered suits, luxury pret, and formal wear delivered globally.',
    keywords: ['South Asian fashion', 'Pakistani clothes international', 'embroidered suits', 'luxury pret', 'calnza'],
  },
}

const META = REGION_META[SITE_COUNTRY] || REGION_META.PK
const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION || META.description

// ─── Viewport ─────────────────────────────────────────────────────────────────
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  viewportFit: 'cover',          // iPhone safe-area / Dynamic Island support
  // Warm cream matches the new eye-comfort background
  // Change back to '#0A0A0A' if you prefer the black browser chrome look
  themeColor: '#0A0A0A',
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: META.title,
    template: `%s | Calnza`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: META.keywords,
  authors: [{ name: APP_NAME, url: APP_URL }],

  // ── Canonical + hreflang ──
  alternates: {
    canonical: APP_URL,
    languages: {
      'en-PK': 'https://calnza.pk',
      'en-GB': 'https://calnza.co.uk',
      'x-default': 'https://calnza.pk',
    },
  },

  // ── PWA / manifest ──
  manifest: '/manifest.json',

  // ── Open Graph ──
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: APP_URL,
    images: [
      {
        url: '/images/hero-boutique.jpg',
        width: 1200,
        height: 630,
        alt: APP_NAME,
      },
    ],
  },

  // ── Twitter/X Card ──
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },

  // ── Apple Web App ──
  appleWebApp: {
    capable: true,
    title: APP_NAME,
    statusBarStyle: 'black-translucent',
    startupImage: [
      // iPhone 14 Pro Max
      {
        url: '/splash/apple-splash-1290x2796.png',
        media:
          'screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)',
      },
      // iPhone 14 / 13 / 12
      {
        url: '/splash/apple-splash-1170x2532.png',
        media:
          'screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)',
      },
      // iPhone SE 3rd gen
      {
        url: '/splash/apple-splash-750x1334.png',
        media:
          'screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },

  // ── Icons ──
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/icons/icon-512-maskable.png',
      },
    ],
  },

  // ── Robots ──
  robots: {
    index: true,
    follow: true,
  },
}

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${dmSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col font-body bg-background text-text-primary"
        suppressHydrationWarning
      >
        <ReduxProvider>
          {/* Scroll progress bar + back-to-top button */}
          <ScrollProgress />
          {/* Exit intent popup — fires once per session on leave intent */}
          <ExitIntentPopup />
          {children}
          <CartDrawer />
          <FloatingWhatsApp />
          {/* Social proof toast — bottom-left sequential notification widget */}
          <SocialProofToast />
        </ReduxProvider>
        <Toaster />
        {/* Registers the service worker client-side after hydration */}
        <SWRegistrar />
      </body>
    </html>
  )
}
