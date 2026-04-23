import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'

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

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // 1. Get token from cookies or authorization header
  const authHeader = req.headers.get('authorization')
  let token = authHeader?.replace('Bearer ', '')
  if (!token) {
    token = req.cookies.get('access_token')?.value
  }

  // 2. Define protected routes
  const isAdminRoute = pathname.startsWith('/d8f2a1/admin')
  const isProtectedUserRoute = pathname.startsWith('/account') || pathname.startsWith('/checkout')
  const isHomeRoute = pathname === '/'

  // 3. Admin Redirect logic for Homepage
  if (isHomeRoute && token) {
    const payload = decodeJwt(token)
    if (payload?.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/d8f2a1/admin', req.url))
    }
  }

  // 4. Protection for /admin routes
  if (isAdminRoute) {
    if (!token) {
      logger.auth('Proxy: No token for admin route', { pathname })
      return NextResponse.redirect(new URL('/login', req.url))
    }
    const payload = decodeJwt(token)
    if (!payload || payload.role !== 'ADMIN') {
      logger.auth('Proxy: Unauthorized role for admin route', { pathname, role: payload?.role })
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // 4.1 Explicitly block access to the old /admin path
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/')) {
     return NextResponse.redirect(new URL('/', req.url))
  }

  // 5. Protection for /account and /checkout routes
  if (isProtectedUserRoute) {
    if (!token) {
      logger.auth('Proxy: No token for protected user route', { pathname })
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
    const payload = decodeJwt(token)
    if (!payload) {
      logger.auth('Proxy: Invalid token for protected route', { pathname })
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  // Matchers for the proxy function
  // Excludes: api, static files, images, favicon, auth routes
  matcher: [
    '/',
    '/admin/:path*',
    '/d8f2a1/admin/:path*',
    '/account/:path*',
    '/checkout/:path*',
    // General exclusion pattern to avoid running on assets but keep protection logic
    '/((?!api|_next/static|_next/image|favicon.ico|login|register|forgot-password|reset-password|verify-otp).*)',
  ],
}
