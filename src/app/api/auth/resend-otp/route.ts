import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { sendOtpEmail } from '@/lib/services/email/otp'
import redis from '@/lib/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Rate limiter: 3 requests per 10 minutes per IP/User
const ratelimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '10 m'),
  analytics: true,
  prefix: 'ratelimit:resend-otp',
}) : null

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json()

    if (!userId && !email) {
      return NextResponse.json({ success: false, error: 'User ID or Email is required' }, { status: 400 })
    }

    // 1. Rate Limiting
    if (ratelimit) {
      const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
      const identifier = userId || email || ip
      const { success } = await ratelimit.limit(identifier)
      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Too many requests. Please try again in 10 minutes.' },
          { status: 429 }
        )
      }
    }

    // 2. Find User
    const user = await db.user.findFirst({
      where: {
        OR: [
          { id: userId || undefined },
          { email: email || undefined }
        ]
      },
      select: { id: true, email: true, name: true, isVerified: true }
    })

    if (!user) {
      // Security: Don't reveal if user exists, but here it's usually called from an active session/page
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    if (user.isVerified) {
      return NextResponse.json({ success: false, error: 'User is already verified' }, { status: 400 })
    }

    // 3. Invalidate old OTPs and generate new one
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await db.$transaction([
      db.otpToken.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true } // Effectively invalidating them
      }),
      db.otpToken.create({
        data: { userId: user.id, code, expiresAt }
      })
    ])

    // 4. Send Email
    await sendOtpEmail(user.email, user.name, code)

    logger.auth('OTP resent', { userId: user.id, email: user.email })

    return NextResponse.json({
      success: true,
      data: { message: 'A new verification code has been sent to your email.' }
    })

  } catch (err) {
    logger.error('[AUTH_RESEND_OTP]', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
