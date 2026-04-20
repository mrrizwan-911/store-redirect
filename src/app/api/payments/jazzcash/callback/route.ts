import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { verifyJazzCashHash } from '@/lib/services/payment/jazzcash/hash'
import { getJazzCashConfig } from '@/lib/services/payment/jazzcash/config'
import { awardOrderPoints } from '@/lib/services/loyalty/award'
import { sendOrderConfirmationEmail } from '@/lib/services/email/orderEmails'
import { logger } from '@/lib/utils/logger'
import { OrderStatus, PaymentStatus } from '@prisma/client'

const JAZZCASH_SUCCESS_CODE = '000'

/**
 * JazzCash Callback (Return URL) handler.
 * JazzCash POSTs the payment result here via form-encoded data.
 */
export async function POST(req: NextRequest) {
  const config = getJazzCashConfig()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  try {
    // JazzCash sends a POST request with form data
    const formData = await req.formData()
    const params: Record<string, string> = {}
    formData.forEach((value, key) => {
      params[key] = String(value)
    })

    logger.payment('[JAZZCASH CALLBACK] Received result', {
      responseCode: params.pp_ResponseCode,
      orderId: params.pp_BillReference,
      txnRef: params.pp_TxnRefNo,
      amount: params.pp_Amount,
    })

    // 1. Verify Hash Integrity
    const isValid = verifyJazzCashHash(params, config.integritySalt)
    if (!isValid) {
      logger.error('[JAZZCASH CALLBACK] Hash verification FAILED — potential tampering detected', { params })
      return NextResponse.redirect(`${appUrl}/checkout/failed?reason=security`)
    }

    const responseCode = params.pp_ResponseCode
    const orderId = params.pp_BillReference
    const txnRefNo = params.pp_TxnRefNo

    if (!orderId) {
      logger.error('[JAZZCASH CALLBACK] Missing order reference in callback')
      return NextResponse.redirect(`${appUrl}/checkout/failed`)
    }

    // 2. Fetch Order and Payment for Idempotency
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { user: true, payment: true },
    })

    if (!order) {
      logger.error('[JAZZCASH CALLBACK] Order not found', { orderId })
      return NextResponse.redirect(`${appUrl}/checkout/failed`)
    }

    // 3. Idempotency Check
    if (order.payment?.status === PaymentStatus.COMPLETED) {
      logger.info('[JAZZCASH CALLBACK] Order already processed. Redirecting to success.', { orderId })
      return NextResponse.redirect(`${appUrl}/checkout/success?order=${orderId}`)
    }

    // 4. Amount Verification
    const expectedAmountPaisas = Math.round(Number(order.total) * 100)
    const receivedAmountPaisas = Number(params.pp_Amount)

    if (receivedAmountPaisas !== expectedAmountPaisas) {
      logger.error('[JAZZCASH CALLBACK] Amount mismatch!', {
        orderId,
        expected: expectedAmountPaisas,
        received: receivedAmountPaisas
      })
      return NextResponse.redirect(`${appUrl}/checkout/failed?reason=amount_mismatch`)
    }

    // 5. Handle Success/Failure
    if (responseCode === JAZZCASH_SUCCESS_CODE) {
      // Payment Successful
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
            gatewayRef: txnRefNo,
            gatewayResponse: params as any,
            paidAt: new Date(),
          },
        })
      })

      // Asynchronous actions (don't block the response)
      if (order.userId) {
        awardOrderPoints(order.userId, Number(order.total), orderId)
          .catch(err => logger.error('[JAZZCASH CALLBACK] Loyalty award failed', { err, orderId }))
      }

      sendOrderConfirmationEmail(order, order.user)
        .catch(err => logger.error('[JAZZCASH CALLBACK] Confirmation email failed', { err, orderId }))

      logger.info('[JAZZCASH CALLBACK] Payment confirmed successfully', { orderId, txnRefNo })
      return NextResponse.redirect(`${appUrl}/checkout/success?order=${orderId}`)

    } else {
      // Payment Failed
      await db.payment.update({
        where: { orderId: orderId },
        data: {
          status: PaymentStatus.FAILED,
          gatewayResponse: params as any,
        },
      }).catch(err => logger.error('[JAZZCASH CALLBACK] Failed to update payment status to FAILED', { err, orderId }))

      logger.warn('[JAZZCASH CALLBACK] Payment failed', { orderId, responseCode, message: params.pp_ResponseMessage })
      return NextResponse.redirect(`${appUrl}/checkout/failed?order=${orderId}&code=${responseCode}`)
    }

  } catch (error) {
    logger.error('[JAZZCASH CALLBACK] Fatal error', { error })
    return NextResponse.redirect(`${appUrl}/checkout/failed?reason=error`)
  }
}
