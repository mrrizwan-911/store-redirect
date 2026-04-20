import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { awardOrderPoints } from '@/lib/services/loyalty/award'
import { sendOrderConfirmationEmail } from '@/lib/services/email/orderEmails'
import { OrderStatus, PaymentStatus } from '@prisma/client'

interface EasypaisaPostback {
  orderId: string
  storeId: string
  paymentToken?: string
  transactionStatus?: string
  transactionAmount?: string
  transactionDateTime?: string
  paymentTokenExpiryDateTime?: string
  Msisdn?: string
  paymentMode?: string
  responseCode: string
  responseDesc: string
}

/**
 * EasyPaisa Postback handler for Card payments.
 * Customer is redirected here after paying on the EasyPay hosted page.
 */
export async function POST(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  try {
    // Card postback comes as form-encoded POST
    const formData = await req.formData()
    const body: Record<string, string> = {}
    formData.forEach((value, key) => {
      body[key] = String(value)
    })

    const data = body as unknown as EasypaisaPostback

    logger.payment('[EASYPAISA POSTBACK] Card payment result received', {
      orderId: data.orderId,
      status: data.transactionStatus,
      responseCode: data.responseCode,
    })

    if (!data.orderId) {
      logger.error('[EASYPAISA POSTBACK] Missing orderId in postback')
      return NextResponse.redirect(`${appUrl}/checkout/failed`)
    }

    // 1. Fetch Order and Payment for Idempotency
    const orderId = data.orderId
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { user: true, payment: true },
    })

    if (!order) {
      logger.error('[EASYPAISA POSTBACK] Order not found', { orderId })
      return NextResponse.redirect(`${appUrl}/checkout/failed`)
    }

    // 2. Idempotency Check
    if (order.payment?.status === PaymentStatus.COMPLETED) {
      logger.info('[EASYPAISA POSTBACK] Already processed. Redirecting to success.', { orderId })
      return NextResponse.redirect(`${appUrl}/checkout/success?order=${orderId}`)
    }

    // 3. Handle Success/Failure
    if (data.responseCode === '0000' || data.transactionStatus === 'PAID') {
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
            gatewayRef: data.paymentToken || data.Msisdn || 'CARD_PAYMENT',
            gatewayResponse: data as any,
            paidAt: new Date(),
          },
        })
      })

      // Asynchronous actions
      if (order.userId) {
        awardOrderPoints(order.userId, Number(order.total), order.id)
          .catch(err => logger.error('[EASYPAISA POSTBACK] Loyalty award failed', { err, orderId }))
      }

      sendOrderConfirmationEmail(order, order.user)
        .catch(err => logger.error('[EASYPAISA POSTBACK] Email confirmation failed', { err, orderId }))

      logger.info('[EASYPAISA POSTBACK] Card payment confirmed successfully', { orderId })
      return NextResponse.redirect(`${appUrl}/checkout/success?order=${orderId}`)

    } else {
      // Payment Failed
      await db.payment.update({
        where: { orderId: orderId },
        data: {
          status: PaymentStatus.FAILED,
          gatewayResponse: data as any,
        },
      }).catch(err => logger.error('[EASYPAISA POSTBACK] Failed to update payment status', { err, orderId }))

      logger.warn('[EASYPAISA POSTBACK] Payment failed', { orderId, responseCode: data.responseCode })
      return NextResponse.redirect(`${appUrl}/checkout/failed?order=${orderId}&code=${data.responseCode}`)
    }

  } catch (error) {
    logger.error('[EASYPAISA POSTBACK] Fatal error', { error })
    return NextResponse.redirect(`${appUrl}/checkout/failed?reason=error`)
  }
}
