import { NextRequest, NextResponse } from 'next/server'
import { rateLimiters, checkRateLimit, getClientIp } from '@/lib/utils/rateLimit'
import { isAccountLocked, recordFailedLogin, clearFailedLogins } from '@/lib/utils/accountLock'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { loginSchema } from '@/lib/validations/auth'
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt'

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req)
    const rateLimitErr = await checkRateLimit(rateLimiters.auth, clientIp)
    if (rateLimitErr) return rateLimitErr
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input' },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    if (await isAccountLocked(email)) {
      return NextResponse.json(
        { success: false, error: 'Account temporarily locked. Try again in 15 minutes.' },
        { status: 429 }
      )
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (!user.isVerified) {
      return NextResponse.json(
        { success: false, error: 'Please verify your email first', userId: user.id },
        { status: 403 }
      )
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatch) {
      await recordFailedLogin(email)
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role }
    await clearFailedLogins(email)
    const accessToken = signAccessToken(tokenPayload)
    const refreshToken = signRefreshToken(tokenPayload)

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

    logger.auth('User logged in', { userId: user.id, email: user.email, role: user.role })

    const response = NextResponse.json({
      success: true,
      data: {
        access_token: accessToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      },
    })

    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.APP_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes in seconds
      path: '/',
    })

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.APP_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: '/',
    })

    return response
  } catch (err) {
    logger.error('[AUTH_LOGIN]', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
