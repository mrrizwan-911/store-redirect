import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { Ratelimit } from '@upstash/ratelimit'
import redis from '@/lib/redis'

// ─── Rate Limiters (via Upstash Redis) ───────────────────────────────────────
const strictRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '10 s'),
      analytics: true,
      prefix: 'ratelimit:strict',
    })
  : null

const standardRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'ratelimit:standard',
    })
  : null

// ─── Bad-bot / Scanner patterns ──────────────────────────────────────────────
const BAD_BOT_UA = [
  /masscan/i, /nmap/i, /nikto/i, /sqlmap/i, /zgrab/i,
  /python-requests\/[01]\./i, /go-http-client\/1\./i,
  /curl\/[0-5]\./i, /libwww-perl/i,
]

// ─── GeoIP site countries ─────────────────────────────────────────────────────
const UK_CODES = new Set(['GB'])
const PK_CODES = new Set(['PK'])

// ─── JWT decode (Edge-safe, no verification) ──────────────────────────────────
function decodeJwt(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) base64 += '='
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── 1. Block bad bots on API routes ────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    const ua = req.headers.get('user-agent') || ''
    if (BAD_BOT_UA.some((p) => p.test(ua))) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  // ── 2. Auth token resolution ────────────────────────────────────────────────
  const authHeader = req.headers.get('authorization')
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
  if (!token) token = req.cookies.get('access_token')?.value ?? null

  const payload = token ? decodeJwt(token) : null
  const isAdmin = payload?.role === 'ADMIN'

  // ── 3. Rate Limiting (non-admin only) ──────────────────────────────────────
  if (redis && !isAdmin) {
    const ip = (req as any).ip || req.headers.get('cf-connecting-ip') || '127.0.0.1'
    const isStrict =
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/checkout') ||
      pathname === '/login' ||
      pathname === '/register'

    const limiter = isStrict ? strictRateLimit : standardRateLimit
    if (limiter && pathname.startsWith('/api/')) {
      const { success, limit, reset, remaining } = await limiter.limit(ip)
      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Too Many Requests. Please slow down.' },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString(),
              'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
            },
          }
        )
      }
    }
  }

  // ── 4. Admin route protection ──────────────────────────────────────────────
  const isAdminRoute = pathname.startsWith('/d8f2a1/admin')
  if (isAdminRoute) {
    if (!token) {
      logger.auth('Middleware: No token for admin route', { pathname })
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('clear_auth', '1')
      return NextResponse.redirect(loginUrl)
    }
    if (!payload || payload.role !== 'ADMIN') {
      logger.auth('Middleware: Unauthorized for admin', { pathname, role: payload?.role })
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // ── 5. /admin → /d8f2a1/admin shortcut ────────────────────────────────────
  if (pathname === '/admin' || pathname === '/admin/') {
    return NextResponse.redirect(new URL('/d8f2a1/admin', req.url))
  }

  // ── 6. Account / Checkout route protection ─────────────────────────────────
  const isUserProtected = pathname.startsWith('/account')
  if (isUserProtected) {
    const refreshToken = req.cookies.get('refresh_token')?.value
    if (!token && !refreshToken) {
      logger.auth('Middleware: No token for user route', { pathname })
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('from', pathname)
      loginUrl.searchParams.set('clear_auth', '1')
      return NextResponse.redirect(loginUrl)
    }
    // Admins should not access /account
    if (payload?.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/d8f2a1/admin', req.url))
    }
  }

  // ── 7. Build response with security headers ────────────────────────────────
  const response = NextResponse.next()

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(self)'
  )

  // No-cache for API & admin
  if (pathname.startsWith('/api/') || pathname.startsWith('/d8f2a1/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  }

  // ── 8. GeoIP country detection (Cloudflare / Vercel) ──────────────────────
  const cfCountry =
    req.headers.get('cf-ipcountry') ||
    req.headers.get('x-vercel-ip-country') ||
    ''

  if (cfCountry) {
    let detectedSite = 'PK'
    if (UK_CODES.has(cfCountry.toUpperCase())) detectedSite = 'UK'
    else if (PK_CODES.has(cfCountry.toUpperCase())) detectedSite = 'PK'

    // Only set cookie if user hasn't already made a choice
    const existingGeo = req.cookies.get('geo_detected')
    if (!existingGeo) {
      response.cookies.set('geo_detected', detectedSite, {
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false, // Readable by JS modal
      })
    }
    response.headers.set('x-detected-country', detectedSite)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|images/|fonts/|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.webp$).*)',
  ],
}
