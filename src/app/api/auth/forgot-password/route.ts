import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { forgotPasswordSchema } from '@/lib/validations/auth'
import { sendForgotPasswordEmail } from '@/lib/services/email/forgotPassword'
import { checkRateLimit, getClientIp, rateLimiters } from '@/lib/utils/rateLimit'

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req)
    const rateLimitErr = await checkRateLimit(rateLimiters.auth, clientIp)
    if (rateLimitErr) return rateLimitErr

    const body = await req.json()
    const parsed = forgotPasswordSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email } = parsed.data
    const user = await db.user.findUnique({ where: { email } })

    // Security requirement: Always return success, never reveal if email exists
    const successResponse = NextResponse.json({
      success: true,
      data: { message: 'If this email exists, a reset link has been sent' },
    })

    if (!user) {
      logger.info('Forgot password requested for non-existent email', { email })
      return successResponse
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Single transaction: Cleanup old tokens and create new one
    await db.$transaction([
      db.passwordResetToken.deleteMany({
        where: { userId: user.id, used: false },
      }),
      db.passwordResetToken.create({
        data: {
          userId: user.id,
          token: tokenHash,
          expiresAt,
        },
      }),
    ])

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

    // Send email
    await sendForgotPasswordEmail(user.email, user.name, resetUrl)

    logger.auth('Forgot password link sent', { userId: user.id })

    return successResponse
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    const errorStack = err instanceof Error ? err.stack : undefined
    logger.error('[AUTH_FORGOT_PASSWORD]', { message: errorMessage, stack: errorStack, error: err })
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Note: Rate limiting for this endpoint is handled in Day 13 security spec.
 */
