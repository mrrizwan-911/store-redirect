import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { getUserSession } from '@/lib/auth/session'
import { initiateHBLPayment } from '@/lib/services/payment/hbl'
import { logger } from '@/lib/utils/logger'

/**
 * Initiates an HBL Hosted Checkout session.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await req.json()
    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 })
    }

    // Verify order ownership and status
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    })

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    if (order.userId !== session.userId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json({ success: false, error: 'Order is already processed' }, { status: 400 })
    }

    const result = await initiateHBLPayment({
      mode: 'HOSTED',
      orderId: order.id,
      amountPKR: Number(order.total),
      customerEmail: order.user?.email || undefined,
      customerName: order.user?.name || undefined,
    })

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.error('[HBL INITIATE ROUTE] Error', { error })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
