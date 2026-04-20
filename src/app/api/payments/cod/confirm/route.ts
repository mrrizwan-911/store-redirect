import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { verifyAccessToken } from '@/lib/auth/jwt'
import { logger } from '@/lib/utils/logger'
import { OrderStatus, PaymentStatus } from '@prisma/client'

/**
 * COD Confirmation Route.
 * Sets the order status to PENDING (to be confirmed by staff)
 * and payment status to PENDING.
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = verifyAccessToken(token)
    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 })
    }

    // Verify order ownership
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { payment: true }
    })

    if (!order || order.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    if (order.payment?.method !== 'COD') {
      return NextResponse.json({ success: false, error: 'Invalid payment method for this route' }, { status: 400 })
    }

    // Update statuses
    await db.$transaction([
      db.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.PENDING }
      }),
      db.payment.update({
        where: { orderId: orderId },
        data: { status: PaymentStatus.PENDING }
      })
    ])

    logger.info('[COD CONFIRM] Order confirmed', { orderId, userId })

    return NextResponse.json({
      success: true,
      message: 'Cash on Delivery order placed. Our team will contact you for confirmation.',
      orderNumber: order.orderNumber
    })
  } catch (error) {
    logger.error('[COD CONFIRM ROUTE] Error', { error })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
