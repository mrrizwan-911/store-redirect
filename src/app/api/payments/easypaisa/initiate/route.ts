import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { getUserSession } from '@/lib/auth/session'
import { initiateEasypaisaPayment, EasypaisaPaymentMode } from '@/lib/services/payment/easypaisa'
import { logger } from '@/lib/utils/logger'
import { getEnabledPaymentMethods } from '@/lib/constants/site'

const initiateSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  mode: z.enum(['MA', 'OTC', 'CARD']),
  mobileAccountNo: z
    .string()
    .regex(/^03\d{9}$/, 'Invalid mobile format. Must be 03xxxxxxxxx (11 digits)')
    .optional(),
})

export async function POST(req: NextRequest) {
  try {
    if (!getEnabledPaymentMethods().includes('EASYPAISA')) {
      return NextResponse.json({ success: false, error: 'EasyPaisa is not available for this region' }, { status: 400 })
    }

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

    const { orderId, mode, mobileAccountNo } = parsed.data

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
      return NextResponse.json(
        { success: false, error: 'Order is already processed' },
        { status: 400 }
      )
    }

    // MA and OTC require mobile number
    if ((mode === 'MA' || mode === 'OTC') && !mobileAccountNo) {
      return NextResponse.json(
        { success: false, error: 'Mobile account number is required for this mode' },
        { status: 400 }
      )
    }

    const result = await initiateEasypaisaPayment({
      mode: mode as EasypaisaPaymentMode,
      orderId,
      amountPKR: Number(order.total),
      mobileAccountNo,
      emailAddress: order.user?.email || undefined,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, responseCode: result.responseCode },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    logger.error('[EASYPAISA INITIATE ROUTE] Error', { error })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
