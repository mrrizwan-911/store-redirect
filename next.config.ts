import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  // Prevent DNS prefetch data leaking
  { key: 'X-DNS-Prefetch-Control', value: 'on' },

  // HSTS — 2 year max-age, include subdomains, preload
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },

  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },

  // Prevent MIME sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  // Referrer policy
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  // Permissions policy — disable dangerous browser features
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  },

  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://res.cloudinary.com https://placehold.co",
      "connect-src 'self' https://api.anthropic.com https://api.openai.com https://api.resend.com https://challenges.cloudflare.com",
      "frame-src https://challenges.cloudflare.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://sandbox.jazzcash.com.pk https://easypay.easypaisa.com.pk",
      "upgrade-insecure-requests",
    ].join('; '),
  },
]

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Cache static assets aggressively at CDN
      {
        source: '/icons/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/images/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https' as const, hostname: 'images.unsplash.com' },
      { protocol: 'https' as const, hostname: 'placehold.co' },
      { protocol: 'https' as const, hostname: 'res.cloudinary.com' },
    ],
    // Cloudinary: use WebP/AVIF for 30-50% smaller images
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 24h image cache
  },
  // Reduce JS bundle size by tree-shaking large packages
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      'date-fns',
    ],
  },
  // Disable source maps in production (prevents source code exposure)
  productionBrowserSourceMaps: false,
  // Enable gzip/brotli compression
  compress: true,
};

export default withSentryConfig(nextConfig, {
  org: "calnza",
  project: "javascript-nextjs",
  silent: true,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  disableLogger: true,
  automaticVercelMonitors: true,
});
