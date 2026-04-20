import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { getUserSession } from '@/lib/auth/session'
import { initiateJazzCashPayment, JazzCashMode } from '@/lib/services/payment/jazzcash'
import { logger } from '@/lib/utils/logger'

const initiateSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  mode: z.enum(['HOSTED', 'WALLET', 'CARD']),
  customerMobile: z
    .string()
    .regex(/^03\d{9}$/, 'Mobile must be in 03xxxxxxxxx format')
    .optional(),
  customerCNIC: z
    .string()
    .regex(/^\d{6}$/, 'CNIC must be exactly 6 digits')
    .optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getUserSession()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = initiateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { orderId, mode, customerMobile, customerCNIC } = parsed.data

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

    const result = await initiateJazzCashPayment({
      mode: mode as JazzCashMode,
      orderId,
      amountPKR: Number(order.total),
      description: `Order #${order.orderNumber}`,
      customerMobile: customerMobile || order.user?.phone || undefined,
      customerCNIC,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, responseCode: result.responseCode },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.error('[JAZZCASH INITIATE ROUTE] Error', { error })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
