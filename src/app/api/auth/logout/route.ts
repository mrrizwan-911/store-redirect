import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refresh_token')?.value

  if (refreshToken) {
    // Silently delete — already expired tokens won't be found, that's fine
    await db.refreshToken.deleteMany({ where: { token: refreshToken } })
    logger.auth('User logged out, refresh token deleted')
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('access_token', '', { maxAge: 0, path: '/' })
  response.cookies.set('refresh_token', '', { maxAge: 0, path: '/' })
  return response
}
