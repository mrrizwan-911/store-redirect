import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { otpSchema } from '@/lib/validations/auth'
import { sendWelcomeEmail } from '@/lib/services/email/welcome'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = otpSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { userId, code } = parsed.data

    const otp = await db.otpToken.findFirst({
      where: {
        userId,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!otp || otp.code !== code) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    // Mark OTP used and user verified in a transaction
    await db.$transaction([
      db.otpToken.update({ where: { id: otp.id }, data: { used: true } }),
      db.user.update({ where: { id: userId }, data: { isVerified: true } }),
    ])

    // Send welcome email (fire and forget)
    db.user.findUnique({ where: { id: userId }, select: { name: true, email: true } })
      .then((user) => {
        if (user) {
          sendWelcomeEmail(user.email, user.name).catch((err) => {
            logger.error('Background welcome email failed', err, { userId })
          })
        }
      })
      .catch((err) => {
        logger.error('Failed to fetch user for welcome email', err, { userId })
      })

    logger.auth('Email verified', { userId })

    return NextResponse.json({
      success: true,
      data: { message: 'Email verified successfully' },
    })
  } catch (err) {
    logger.error('[AUTH_VERIFY_OTP]', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
