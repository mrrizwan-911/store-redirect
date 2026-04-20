import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { getUserSession } from '@/lib/auth/session'
import { initiateHBLPayment } from '@/lib/services/payment/hbl'
import { logger } from '@/lib/utils/logger'

/**
 * Authorizes an HBL payment using a sessionId from HBL Elements.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId, sessionId } = await req.json()
    if (!orderId || !sessionId) {
      return NextResponse.json({ success: false, error: 'orderId and sessionId are required' }, { status: 400 })
    }

    // Verify order ownership
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    })

    if (!order || order.userId !== session.userId) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    const result = await initiateHBLPayment({
      mode: 'ELEMENTS',
      orderId: order.id,
      amountPKR: Number(order.total),
      elementsSessionId: sessionId,
    })

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        gatewayCode: result.gatewayCode
      }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.error('[HBL AUTHORIZE ROUTE] Error', { error })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
