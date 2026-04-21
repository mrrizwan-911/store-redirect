import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { getUserSession } from '@/lib/auth/session'
import { logger } from '@/lib/utils/logger'

export async function GET() {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const quotations = await db.quotation.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, data: quotations })
  } catch (error) {
    logger.error('[API_ACCOUNT_QUOTATIONS_GET]', error)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}
