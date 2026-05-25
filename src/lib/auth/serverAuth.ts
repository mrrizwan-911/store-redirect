import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyRefreshToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/utils/logger'

export async function validateAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('refresh_token')?.value

  if (!token) {
    redirect('/login')
  }

  try {
    const payload = verifyRefreshToken(token)
    if (payload.role !== 'ADMIN') {
      redirect('/login')
    }
    return payload.userId
  } catch (error) {
    logger.error("Server Auth Admin Check Failed:", error)
    redirect('/login')
  }
}
