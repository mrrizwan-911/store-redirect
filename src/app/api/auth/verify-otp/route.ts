import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { otpSchema } from '@/lib/validations/auth'
import { sendWelcomeEmail } from '@/lib/services/email/welcome'
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt'
import { awardPoints } from '@/lib/services/loyalty/award'

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
      include: { user: true },
    })

    if (!otp || otp.code !== code) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired OTP' },
        { status: 400 }
      )
    }

    // Mark OTP used and user verified (and upgrade guest) in a transaction
    const [_, user] = await db.$transaction([
      db.otpToken.update({ where: { id: otp.id }, data: { used: true } }),
      db.user.update({
        where: { id: userId },
        data: {
          isVerified: true,
          ...(otp.user.role === 'GUEST' ? { role: 'CUSTOMER' } : {})
        }
      }),
    ])

    // 1. Issue JWT tokens for auto-login
    const tokenPayload = { userId: user.id, email: user.email, role: user.role }
    const accessToken = signAccessToken(tokenPayload)
    const refreshToken = signRefreshToken(tokenPayload)

    // 2. Persist refresh token
    await db.$transaction([
      db.refreshToken.deleteMany({ where: { userId: user.id } }),
      db.refreshToken.create({
        data: {
          userId: user.id,
          token: refreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ])

    // 3. Handle Referral Points Award
    if (user.notes && user.notes.startsWith('Referred by:')) {
      const referralCode = user.notes.replace('Referred by: ', '').trim()
      const referrer = await db.user.findFirst({
        where: { referralCode }
      })
      if (referrer) {
        // Award 100 points (PKR 100) to the referrer
        await awardPoints(referrer.id, 100, `Referral Bonus (New User: ${user.name})`, 'REFERRAL')
        // Award 100 points (PKR 100) to the referred user too
        await awardPoints(user.id, 100, `Welcome Bonus (Referred by: ${referrer.name})`, 'REFERRAL')
      }
    }

    // Send welcome email (fire and forget)
    sendWelcomeEmail(user.email, user.name).catch((err) => {
      logger.error('Background welcome email failed', err, { userId })
    })

    logger.auth('Email verified & User auto-logged in', { userId })

    const response = NextResponse.json({
      success: true,
      data: {
        message: 'Email verified successfully',
        access_token: accessToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      },
    })

    // 3. Set cookies
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.APP_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    })

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.APP_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return response
  } catch (err) {
    logger.error('[AUTH_VERIFY_OTP]', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
