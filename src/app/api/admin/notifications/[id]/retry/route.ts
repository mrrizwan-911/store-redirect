import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/utils/adminAuth'
import { logger } from '@/lib/utils/logger'
import { retryEmailLog } from '@/lib/services/email/retry'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authRes = await requireAdmin(req)
  if (authRes instanceof NextResponse) return authRes

  const { id } = await params

  try {
    const result = await retryEmailLog(id)
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status })
    }

    logger.info(`Admin ${authRes} retried email log ID: ${id}`)

    return NextResponse.json(
      { success: true, message: 'Retry email sent' },
      { status: 200 }
    )
  } catch (error) {
    logger.error(`Error retrying notification: ${id}`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
