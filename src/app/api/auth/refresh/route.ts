import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/auth/jwt'
import redis from '@/lib/redis'

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get('refresh_token')?.value
    if (!refreshToken) {
      return NextResponse.json({ success: false, error: 'No refresh token' }, { status: 401 })
    }

    // 1. Verify token & check DB
    const payload = verifyRefreshToken(refreshToken)
    const stored = await db.refreshToken.findUnique({ where: { token: refreshToken } })

    // 2. Race condition guard: check if this specific JTI was recently rotated
    const lockKey = `refresh_lock:${payload.jti}`
    const alreadyProcessed = await redis.get(lockKey)

    if (alreadyProcessed) {
      logger.auth('Refresh race condition detected, returning new access token', { jti: payload.jti })
      const accessToken = signAccessToken({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      })
      const response = NextResponse.json({
        success: true,
        data: { access_token: accessToken }
      })
      response.cookies.set('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.APP_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60,
        path: '/',
      })
      return response
    }

    if (!stored || stored.expiresAt < new Date()) {
      return NextResponse.json({ success: false, error: 'Invalid refresh token' }, { status: 401 })
    }

    // 3. Mark this JTI as being processed (60s TTL covers any client retry/race)
    await redis.set(lockKey, '1', { ex: 60 })

    // 4. Rotate: delete old, create new
    const newRefreshToken = signRefreshToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    })

    await db.$transaction([
      db.refreshToken.delete({ where: { id: stored.id } }),
      db.refreshToken.create({
        data: {
          userId: payload.userId,
          token: newRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ])

    const accessToken = signAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    })

    logger.auth('Token refreshed', { userId: payload.userId })

    const response = NextResponse.json({ success: true, data: { access_token: accessToken } })
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.APP_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes in seconds
      path: '/',
    })
    response.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.APP_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (err) {
    logger.error('[AUTH_REFRESH]', err)
    return NextResponse.json({ success: false, error: 'Invalid refresh token' }, { status: 401 })
  }
}
