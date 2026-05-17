import { NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { getUserSession } from '@/lib/auth/session'
import { logger } from '@/lib/utils/logger'

export async function GET() {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Primary: find by userId
    let quotations = await db.quotation.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    })

    // Fallback: if nothing found by userId, match by email.
    // This covers cases where the quotation was submitted but userId was null
    // (e.g. session race condition at submit time).
    if (quotations.length === 0 && session.userId) {
      const user = await db.user.findUnique({
        where: { id: session.userId },
        select: { email: true },
      })

      if (user?.email) {
        const byEmail = await db.quotation.findMany({
          where: { email: user.email, userId: null },
          orderBy: { createdAt: 'desc' },
        })

        // Back-link those quotations to this user so future lookups work
        if (byEmail.length > 0) {
          const ids = byEmail.map((q) => q.id)
          await db.quotation.updateMany({
            where: { id: { in: ids } },
            data: { userId: session.userId },
          })
          quotations = [...byEmail, ...quotations]
        }
      }
    }

    return NextResponse.json({ success: true, data: quotations })
  } catch (error) {
    logger.error('[API_ACCOUNT_QUOTATIONS_GET]', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
