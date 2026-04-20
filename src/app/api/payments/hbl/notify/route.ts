import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { getHBLConfig } from '@/lib/services/payment/hbl/config'
import { awardOrderPoints } from '@/lib/services/loyalty/award'
import { sendOrderConfirmationEmail } from '@/lib/services/email/orderEmails'
import { logger } from '@/lib/utils/logger'
import { OrderStatus, PaymentStatus } from '@prisma/client'

interface MPGSNotification {
  order?: {
    id: string
    amount: string
    currency: string
    status: string
    totalAuthorizedAmount?: string
    totalCapturedAmount?: string
  }
  transaction?: {
    id: string
    type: string
    result: string
    authorizationCode?: string
    receipt?: string
  }
  merchant?: {
    id: string
  }
}

/**
 * HBL/MPGS Server-to-Server Notification Handler (Webhook).
 * MPGS sends status updates here for payment events.
 */
export async function POST(req: NextRequest) {
  const config = getHBLConfig()

  try {
    // 1. Basic security validation
    const incomingSecret = req.headers.get('x-notification-secret')
    if (incomingSecret !== config.webhookSecret) {
      logger.warn('[HBL NOTIFY] Invalid webhook secret. Ignoring request.')
      // Return 200 anyway to prevent MPGS from retrying indefinitely on auth failure
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const body: MPGSNotification = await req.json()

    logger.payment('[HBL NOTIFY] Received notification', {
      orderId: body.order?.id,
      orderStatus: body.order?.status,
      txnResult: body.transaction?.result,
    })

    const orderId = body.order?.id
    if (!orderId) {
      return NextResponse.json({ received: true }, { status: 200 })
    }

    // 2. Fetch Order and check status (Idempotency)
    const payment = await db.payment.findUnique({
      where: { orderId },
      include: { order: { include: { user: true } } },
    })

    if (!payment) {
      logger.warn('[HBL NOTIFY] No payment record found for orderId:', { orderId })
      return NextResponse.json({ received: true }, { status: 200 })
    }

    if (payment.status === PaymentStatus.COMPLETED || payment.status === PaymentStatus.REFUNDED) {
      logger.info('[HBL NOTIFY] Already processed. Skipping.', { orderId })
      return NextResponse.json({ received: true }, { status: 200 })
    }

    const txnResult = body.transaction?.result
    const orderStatus = body.order?.status

    // 3. Handle success
    // For HBL/MPGS, a successfully completed payment usually has txnResult "SUCCESS" and orderStatus "CAPTURED"
    if (txnResult === 'SUCCESS' && orderStatus === 'CAPTURED') {
      await db.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.CONFIRMED },
        })

        await tx.payment.update({
          where: { orderId: orderId },
          data: {
            status: PaymentStatus.COMPLETED,
            gatewayRef: body.transaction?.id,
            gatewayResponse: body as any,
            paidAt: new Date(),
          },
        })
      })

      // Asynchronous actions
      const order = payment.order
      if (order.userId) {
        awardOrderPoints(order.userId, Number(order.total), orderId)
          .catch(err => logger.error('[HBL NOTIFY] Loyalty error:', { err, orderId }))
      }

      sendOrderConfirmationEmail(order, order.user)
        .catch(err => logger.error('[HBL NOTIFY] Email error:', { err, orderId }))

      logger.info('[HBL NOTIFY] Order confirmed via webhook', { orderId })
    }

    return NextResponse.json({ received: true }, { status: 200 })

  } catch (error) {
    logger.error('[HBL NOTIFY] Error processing notification', { error })
    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 })
  }
}
