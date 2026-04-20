import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { retrieveHBLPaymentResult } from '@/lib/services/payment/hbl/hostedCheckout'
import { awardOrderPoints } from '@/lib/services/loyalty/award'
import { sendOrderConfirmationEmail } from '@/lib/services/email/orderEmails'
import { logger } from '@/lib/utils/logger'
import { OrderStatus, PaymentStatus } from '@prisma/client'

/**
 * HBL Return URL Handler.
 * Customer is redirected here after completing payment on HBL hosted page.
 */
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const searchParams = req.nextUrl.searchParams

  // resultIndicator is a security token returned by MPGS to verify the session
  const resultIndicator = searchParams.get('resultIndicator')
  const orderId = searchParams.get('orderId')

  if (!orderId || !resultIndicator) {
    logger.error('[HBL RETURN] Missing orderId or resultIndicator in return URL')
    return NextResponse.redirect(`${appUrl}/checkout/failed?reason=invalid_callback`)
  }

  try {
    // Retrieve full payment result from MPGS
    const paymentResult = await retrieveHBLPaymentResult(orderId)

    if (!paymentResult) {
      logger.error('[HBL RETURN] Could not retrieve payment result from MPGS', { orderId })
      return NextResponse.redirect(`${appUrl}/checkout/failed?order=${orderId}`)
    }

    if (paymentResult.result === 'SUCCESS') {
      // 1. Idempotency Check
      const payment = await db.payment.findUnique({
        where: { orderId },
        include: { order: { include: { user: true } } }
      })

      if (payment?.status === PaymentStatus.COMPLETED) {
        logger.info('[HBL RETURN] Order already processed. Redirecting to success.', { orderId })
        return NextResponse.redirect(`${appUrl}/checkout/success?order=${orderId}`)
      }

      if (!payment) {
        logger.error('[HBL RETURN] Payment record not found for order', { orderId })
        return NextResponse.redirect(`${appUrl}/checkout/failed`)
      }

      // 2. Update status
      const [order] = await db.$transaction([
        db.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.CONFIRMED },
          include: { user: true },
        }),
        db.payment.update({
          where: { orderId: orderId },
          data: {
            status: PaymentStatus.COMPLETED,
            gatewayRef: paymentResult.transaction?.id || resultIndicator,
            gatewayResponse: paymentResult as any,
            paidAt: new Date(),
          },
        }),
      ])

      // 3. Asynchronous actions
      if (order.userId) {
        awardOrderPoints(order.userId, Number(order.total), orderId)
          .catch(err => logger.error('[HBL RETURN] Loyalty error:', { err, orderId }))
      }

      sendOrderConfirmationEmail(order, order.user)
        .catch(err => logger.error('[HBL RETURN] Email error:', { err, orderId }))

      logger.info('[HBL RETURN] Payment confirmed successfully', { orderId })
      return NextResponse.redirect(`${appUrl}/checkout/success?order=${orderId}`)
    } else {
      // Payment Failed or Pending
      await db.payment.update({
        where: { orderId },
        data: {
          status: PaymentStatus.FAILED,
          gatewayResponse: paymentResult as any,
        },
      }).catch(() => {})

      logger.warn('[HBL RETURN] Payment result not successful', { orderId, result: paymentResult.result })
      return NextResponse.redirect(
        `${appUrl}/checkout/failed?order=${orderId}&code=${paymentResult.gatewayCode || 'failed'}`
      )
    }
  } catch (error) {
    logger.error('[HBL RETURN] Fatal error', { error, orderId })
    return NextResponse.redirect(`${appUrl}/checkout/failed?reason=error`)
  }
}
