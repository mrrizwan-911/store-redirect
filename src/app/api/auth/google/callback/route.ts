import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt'
import { sendWelcomeEmail } from '@/lib/services/email/welcome'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (!code) {
    return NextResponse.redirect(`${appUrl}/login?error=oauth_denied`)
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${appUrl}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenRes.json()
    if (!tokenRes.ok || !tokenData.access_token) {
      logger.error('Google token exchange failed', undefined, tokenData)
      return NextResponse.redirect(`${appUrl}/login?error=oauth_failed`)
    }

    // Fetch user profile from Google
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const profile = await profileRes.json()

    if (!profile.email) {
      return NextResponse.redirect(`${appUrl}/login?error=oauth_no_email`)
    }

    // Check if user already exists and what role they have
    const existingUser = await db.user.findUnique({
      where: { email: profile.email },
      select: { id: true, role: true, name: true }
    })

    let user
    if (existingUser) {
      // Upgrade GUEST to CUSTOMER, leave CUSTOMER/ADMIN roles untouched
      const updateData: any = { googleId: profile.sub }
      if (existingUser.role === 'GUEST') {
        updateData.role = 'CUSTOMER'
        updateData.isVerified = true
      }
      user = await db.user.update({
        where: { id: existingUser.id },
        data: updateData,
      })
    } else {
      // New user — create as CUSTOMER
      user = await db.user.create({
        data: {
          email: profile.email,
          name: profile.name ?? profile.email.split('@')[0],
          googleId: profile.sub,
          role: 'CUSTOMER',
          isVerified: true,
        },
      })
      // Fire welcome email for genuinely new users only
      sendWelcomeEmail(user.email, user.name).catch(err =>
        logger.error('Failed to trigger welcome email after OAuth', err, { userId: user.id })
      )
    }

    const tokenPayload = { userId: user.id, email: user.email, role: user.role }
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

    logger.auth('Google OAuth login', { userId: user.id, email: user.email })

    const redirectPath = user.role === 'ADMIN' ? '/d8f2a1/admin' : '/account'
    const response = NextResponse.redirect(`${appUrl}${redirectPath}`)

    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.APP_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })
    // Pass access token via a short-lived cookie for client-side pickup and middleware
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.APP_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    })

    return response
  } catch (err) {
    logger.error('Google OAuth callback failed', err)
    return NextResponse.redirect(`${appUrl}/login?error=oauth_error`)
  }
}
