import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { registerSchema } from '@/lib/validations/auth'
import { sendOtpEmail } from '@/lib/services/email/otp'
import { isAdminEmail } from '@/lib/auth/admin'
import { rateLimiters, checkRateLimit, getClientIp } from '@/lib/utils/rateLimit'
import { isDisposableEmail } from '@/lib/utils/emailValidation'

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req)
    const rateLimitErr = await checkRateLimit(rateLimiters.auth, clientIp)
    if (rateLimitErr) return rateLimitErr
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, full_name, fullName, email, password } = parsed.data

    if (await isDisposableEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Please use a real, permanent email address.' },
        { status: 400 }
      )
    }

    if (isAdminEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Registration not allowed for this email' },
        { status: 403 }
      )
    }

    const finalName = name || full_name || fullName || 'User'

    const cookieStore = await cookies()
    const referredBy = cookieStore.get('referral_code')?.value

    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      if (existingUser.role !== 'GUEST') {
        // Only GUEST accounts can be upgraded — block all other existing accounts
        return NextResponse.json(
          { success: false, error: 'Email already registered' },
          { status: 409 }
        )
      }

      // GUEST upgrade path: hash new password, store temporarily, send OTP
      const passwordHash = await bcrypt.hash(password, 12)
      await db.user.update({
        where: { id: existingUser.id },
        data: {
          name: finalName,
          passwordHash,
          notes: referredBy ? `Referred by: ${referredBy}` : existingUser.notes,
          referralCode: existingUser.referralCode || Math.random().toString(36).substring(2, 10).toUpperCase()
        },
      })

      const code = Math.floor(100000 + Math.random() * 900000).toString()
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

      await db.otpToken.create({
        data: { userId: existingUser.id, code, expiresAt },
      })

      await sendOtpEmail(email, finalName, code)
      logger.auth('Guest upgrade OTP sent', { userId: existingUser.id, email })

      const response = NextResponse.json(
        { success: true, data: { userId: existingUser.id, message: 'OTP sent to email' } },
        { status: 200 }
      )

      if (referredBy) {
        response.cookies.delete('referral_code')
      }

      return response
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await db.user.create({
      data: {
        name: finalName,
        email,
        passwordHash,
        role: 'CUSTOMER',
        notes: referredBy ? `Referred by: ${referredBy}` : null,
        referralCode: Math.random().toString(36).substring(2, 10).toUpperCase()
      },
    })

    // 6-digit OTP, valid for 10 minutes
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await db.otpToken.create({
      data: { userId: user.id, code, expiresAt },
    })

    await sendOtpEmail(email, finalName, code)

    logger.auth('User registered', { userId: user.id, email })

    const response = NextResponse.json(
      { success: true, data: { userId: user.id, message: 'OTP sent to email' } },
      { status: 201 }
    )

    if (referredBy) {
      response.cookies.delete('referral_code')
    }

    return response
  } catch (err) {
    logger.error('[AUTH_REGISTER]', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
