import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import { Ratelimit } from '@upstash/ratelimit'
import redis from '@/lib/redis'

// Create different rate limiters for different purposes
// 1. Strict for Auth & Checkout (prevent brute force/spam)
const strictRateLimit = redis ? new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
  prefix: 'ratelimit:strict',
}) : null

// 2. Standard for General API
const standardRateLimit = redis ? new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'ratelimit:standard',
}) : null

// Helper to decode JWT payload without verification (for Edge runtime)
function decodeJwt(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Replace characters for base64url and add padding
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    const payload = JSON.parse(atob(base64));
    return payload;
  } catch (error) {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ip = (req as any).ip || '127.0.0.1'

  // 1. Get token from cookies or authorization header
  const authHeader = req.headers.get('authorization')
  let token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null

  if (!token) {
    const cookie = req.cookies.get('access_token')
    token = cookie?.value || null
  }

  const payload = token ? decodeJwt(token) : null
  const isAdmin = payload?.role === 'ADMIN'

  // --- Rate Limiting Logic (Moved from middleware.ts) ---
  // Only apply rate limiting to non-admin users to prevent management tasks from being blocked
  if (redis && !isAdmin) {
    // 1. Strict Rate Limiting for Sensitive Paths
    if (
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/checkout') ||
      pathname === '/login' ||
      pathname === '/register'
    ) {
      if (strictRateLimit) {
        const { success, limit, reset, remaining } = await strictRateLimit.limit(ip)
        if (!success) {
          return NextResponse.json(
            { success: false, error: 'Too Many Requests' },
            {
              status: 429,
              headers: {
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': remaining.toString(),
                'X-RateLimit-Reset': reset.toString(),
              },
            }
          )
        }
      }
    }
    // 2. Standard Rate Limiting for other API routes
    else if (pathname.startsWith('/api')) {
      if (standardRateLimit) {
        const { success, limit, reset, remaining } = await standardRateLimit.limit(ip)
        if (!success) {
          return NextResponse.json(
            { success: false, error: 'Too Many Requests' },
            {
              status: 429,
              headers: {
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': remaining.toString(),
                'X-RateLimit-Reset': reset.toString(),
              },
            }
          )
        }
      }
    }
  }

  // --- Original Proxy/Auth Logic ---
  // 2. Define protected routes
  const isAdminRoute = pathname.startsWith('/d8f2a1/admin')
  const isProtectedUserRoute = pathname.startsWith('/account')

  // 3. Protection for /admin routes
  if (isAdminRoute) {
    if (!token) {
      logger.auth('Proxy: No token for admin route', { pathname })
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('clear_auth', '1')
      return NextResponse.redirect(loginUrl)
    }
    const payload = decodeJwt(token)
    if (!payload || payload.role !== 'ADMIN') {
      logger.auth('Proxy: Unauthorized role for admin route', { pathname, role: payload?.role })
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // 4. Redirect /admin to the actual admin dashboard
  if (pathname === '/admin' || pathname === '/admin/') {
     return NextResponse.redirect(new URL('/d8f2a1/admin', req.url))
  }

  // 5. Protection for /account and /checkout routes
  if (isProtectedUserRoute) {
    if (!token) {
      // Check if they have a refresh token - if so, let them through
      // and let client-side fetchWithAuth handle the refresh
      const refreshToken = req.cookies.get('refresh_token')?.value
      if (refreshToken) {
        return NextResponse.next()
      }

      logger.auth('Proxy: No token for protected user route', { pathname })
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('from', pathname)
      loginUrl.searchParams.set('clear_auth', '1')
      return NextResponse.redirect(loginUrl)
    }
    const payload = decodeJwt(token)
    if (!payload) {
      // If token is invalid but they have a refresh token, let them through
      const refreshToken = req.cookies.get('refresh_token')?.value
      if (refreshToken) {
        return NextResponse.next()
      }

      logger.auth('Proxy: Invalid token for protected route', { pathname })
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('from', pathname)
      loginUrl.searchParams.set('clear_auth', '1')
      return NextResponse.redirect(loginUrl)
    }

    // NEW: Prevent ADMIN from accessing /account routes
    if (payload.role === 'ADMIN') {
      logger.auth('Proxy: Admin attempting to access /account route, redirecting to admin panel', { pathname })
      return NextResponse.redirect(new URL('/d8f2a1/admin', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  // Matchers for the proxy function
  // Now includes API routes for rate limiting
  matcher: [
    '/',
    '/api/:path*',
    '/admin/:path*',
    '/d8f2a1/admin/:path*',
    '/account/:path*',
    '/checkout/:path*',
    '/login',
    '/register',
    // General exclusion pattern to avoid running on assets but keep protection logic
    '/((?!_next/static|_next/image|favicon.ico|forgot-password|reset-password|verify-otp).*)',
  ],
}
