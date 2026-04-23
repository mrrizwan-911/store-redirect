import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'

export async function POST(req: NextRequest) {
  const accessToken = req.cookies.get('access_token')?.value

  if (accessToken) {
    try {
      // decode without verification so expired tokens still yield userId
      const payload = jwt.decode(accessToken) as { userId?: string } | null
      if (payload?.userId) {
        await db.refreshToken.deleteMany({ where: { userId: payload.userId } })
        logger.auth('User logged out, all refresh tokens deleted', { userId: payload.userId })
      }
    } catch {
      // malformed token — still clear cookies below
    }
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('access_token', '', { maxAge: 0, path: '/' })
  response.cookies.set('refresh_token', '', { maxAge: 0, path: '/' })
  return response
}
