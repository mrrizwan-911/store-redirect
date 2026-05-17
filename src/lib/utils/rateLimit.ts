import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextRequest, NextResponse } from 'next/server'

const redis = Redis.fromEnv()

export const rateLimiters = {
  // Auth endpoints — strictest
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(5, '15 m'),
    prefix: 'rl:auth',
    analytics: true,
  }),

  // Checkout — per user, not just IP
  checkout: new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(10, '1 m'),
    prefix: 'rl:checkout',
    analytics: true,
  }),

  // AI endpoints — expensive, limit hard
  ai: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    prefix: 'rl:ai',
    analytics: true,
  }),

  // General public API — generous
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    prefix: 'rl:api',
    analytics: true,
  }),

  // OTP requests — prevent OTP brute force
  otp: new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(3, '10 m'),
    prefix: 'rl:otp',
    analytics: true,
  }),
}

/**
 * Checks rate limit and returns a NextResponse if limit exceeded, null if OK.
 * Caller should: const rateLimitErr = await checkRateLimit(...).
 *               if (rateLimitErr) return rateLimitErr
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string  // IP address or userId
): Promise<NextResponse | null> {
  const { success, limit, remaining, reset } = await limiter.limit(identifier)

  if (!success) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    )
  }

  return null
}

/**
 * Gets client IP from Next.js request, with fallback.
 */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'anonymous'
  )
}
