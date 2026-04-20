import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { db } from '@/lib/db/client'
import { inquireTransaction } from '@/lib/services/payment/easypaisa'
import { logger } from '@/lib/utils/logger'

/**
 * EasyPaisa Transaction Inquiry API.
 * Used to poll the status of a transaction (especially OTC).
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = verifyAccessToken(token)
    const orderId = req.nextUrl.searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 })
    }

    // Verify order ownership
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { userId: true }
    })

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    if (order.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    const inquiry = await inquireTransaction(orderId)

    return NextResponse.json({ success: true, data: inquiry })
  } catch (error) {
    logger.error('[EASYPAISA INQUIRY ROUTE] Error', { error })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
