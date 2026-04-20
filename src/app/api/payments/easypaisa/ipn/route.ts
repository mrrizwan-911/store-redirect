import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { awardOrderPoints } from '@/lib/services/loyalty/award'
import { sendOrderConfirmationEmail } from '@/lib/services/email/orderEmails'
import { OrderStatus, PaymentStatus } from '@prisma/client'

interface EasypaisaIPN {
  orderId: string
  storeId: string
  transactionId?: string
  transactionStatus: 'PAID' | 'FAILED' | 'PENDING' | 'BLOCKED' | 'EXPIRED' | 'REVERSED'
  transactionAmount?: string
  transactionDateTime?: string
  paymentToken?: string
  paymentMode?: 'MA' | 'OTC' | 'CC'
  Msisdn?: string
  responseCode: string
  responseDesc: string
  optional1?: string
  optional2?: string
  optional3?: string
  optional4?: string
  optional5?: string
}

/**
 * EasyPaisa IPN (Instant Payment Notification) Webhook.
 * Handles background updates from EasyPaisa (e.g., OTC collection).
 */
export async function POST(req: NextRequest) {
  try {
    let body: EasypaisaIPN
    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      body = await req.json()
    } else {
      // EasyPaisa sometimes sends form-encoded IPN
      const text = await req.text()
      const params = new URLSearchParams(text)
      body = Object.fromEntries(params.entries()) as unknown as EasypaisaIPN
    }

    logger.payment('[EASYPAISA IPN] Notification received', {
      orderId: body.orderId,
      status: body.transactionStatus,
      responseCode: body.responseCode,
      transactionId: body.transactionId,
    })

    // 1. Idempotency — check if already processed
    const payment = await db.payment.findUnique({
      where: { orderId: body.orderId },
      include: { order: { include: { user: true } } },
    })

    if (!payment) {
      logger.warn('[EASYPAISA IPN] No payment record found', { orderId: body.orderId })
      // Return 200 so EasyPaisa stops retrying
      return NextResponse.json({ success: true, message: 'Order not found' })
    }

    if (payment.status === PaymentStatus.COMPLETED || payment.status === PaymentStatus.REFUNDED) {
      logger.info('[EASYPAISA IPN] Already processed. Skipping.', { orderId: body.orderId })
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    // 2. Update status if payment confirmed
    if (body.transactionStatus === 'PAID' || body.responseCode === '0000') {
      const orderId = body.orderId

      await db.$transaction(async (tx) => {
        // Update Order status
        await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.CONFIRMED },
        })

        // Update Payment status
        await tx.payment.update({
          where: { orderId: orderId },
          data: {
            status: PaymentStatus.COMPLETED,
            gatewayRef: body.transactionId || body.paymentToken,
            gatewayResponse: body as any,
            paidAt: new Date(),
          },
        })
      })

      // Asynchronous actions
      const order = payment.order
      if (order.userId) {
        awardOrderPoints(order.userId, Number(order.total), order.id)
          .catch(err => logger.error('[EASYPAISA IPN] Loyalty award failed', { err, orderId }))
      }

      sendOrderConfirmationEmail(order, order.user)
        .catch(err => logger.error('[EASYPAISA IPN] Email failed', { err, orderId }))

      logger.info('[EASYPAISA IPN] Payment confirmed successfully', { orderId })
    } else {
      // Payment failed / expired / blocked
      await db.payment.update({
        where: { orderId: body.orderId },
        data: {
          status: PaymentStatus.FAILED,
          gatewayResponse: body as any,
        },
      })

      logger.warn('[EASYPAISA IPN] Payment failed or pending', {
        orderId: body.orderId,
        status: body.transactionStatus,
        code: body.responseCode
      })
    }

    // Always return 200 to EasyPaisa to stop retries
    return NextResponse.json({ success: true })

  } catch (error) {
    logger.error('[EASYPAISA IPN] Error processing notification', { error })
    // Still return 200 to avoid indefinite retries on parsing errors
    return NextResponse.json({ success: true }, { status: 200 })
  }
}
