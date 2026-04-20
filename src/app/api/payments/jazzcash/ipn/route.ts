import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db/client'
import { verifyJazzCashHash } from '@/lib/services/payment/jazzcash/hash'
import { getJazzCashConfig } from '@/lib/services/payment/jazzcash/config'
import { awardOrderPoints } from '@/lib/services/loyalty/award'
import { sendOrderConfirmationEmail } from '@/lib/services/email/orderEmails'
import { logger } from '@/lib/utils/logger'
import { OrderStatus, PaymentStatus } from '@prisma/client'

/**
 * JazzCash IPN (Instant Payment Notification) handler.
 * JazzCash sends asynchronous notifications here.
 * Important: Return 200 status code immediately to acknowledge receipt.
 */
export async function POST(req: NextRequest) {
  const config = getJazzCashConfig()

  try {
    let params: Record<string, string> = {}
    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      params = await req.json()
    } else {
      const formData = await req.formData()
      formData.forEach((value, key) => {
        params[key] = String(value)
      })
    }

    logger.payment('[JAZZCASH IPN] Notification received', {
      responseCode: params.pp_ResponseCode,
      orderId: params.pp_BillReference,
      txnRef: params.pp_TxnRefNo,
    })

    // 1. Send response immediately to stop JazzCash from retrying
    // We'll process the data in the background (using a separate async call)
    processAsyncIPN(params, config.integritySalt).catch(err => {
      logger.error('[JAZZCASH IPN] Background processing error', { err })
    })

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    logger.error('[JAZZCASH IPN] Route error', { error })
    // Still return 200 even on error to stop retries if the error is on our side parsing
    return NextResponse.json({ success: true }, { status: 200 })
  }
}

/**
 * Background processing logic for IPN.
 * Includes hash verification and DB updates.
 */
async function processAsyncIPN(params: Record<string, string>, salt: string) {
  // 1. Verify Hash
  const isValid = verifyJazzCashHash(params, salt)
  if (!isValid) {
    logger.error('[JAZZCASH IPN] Hash verification FAILED', { params })
    return
  }

  const responseCode = params.pp_ResponseCode
  const orderId = params.pp_BillReference
  const txnRefNo = params.pp_TxnRefNo

  if (!orderId) {
    logger.error('[JAZZCASH IPN] Missing pp_BillReference')
    return
  }

  // 2. Fetch Order and check status (Idempotency)
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { user: true, payment: true },
  })

  if (!order) {
    logger.error('[JAZZCASH IPN] Order not found', { orderId })
    return
  }

  if (order.payment?.status === PaymentStatus.COMPLETED) {
    logger.info('[JAZZCASH IPN] Order already completed. Skipping.', { orderId })
    return
  }

  // 3. Amount Verification
  const expectedAmountPaisas = Math.round(Number(order.total) * 100)
  const receivedAmountPaisas = Number(params.pp_Amount)

  if (receivedAmountPaisas !== expectedAmountPaisas) {
    logger.error('[JAZZCASH IPN] Amount mismatch!', {
      orderId,
      expected: expectedAmountPaisas,
      received: receivedAmountPaisas
    })
    return
  }

  // 4. Update status if payment successful
  if (responseCode === '000') {
    await db.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CONFIRMED },
      })

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

    // Loyalty and Email
    if (order.userId) {
      await awardOrderPoints(order.userId, Number(order.total), orderId)
        .catch(err => logger.error('[JAZZCASH IPN] Loyalty award failed', { err, orderId }))
    }

    await sendOrderConfirmationEmail(order, order.user)
      .catch(err => logger.error('[JAZZCASH IPN] Email confirmation failed', { err, orderId }))

    logger.info('[JAZZCASH IPN] Order confirmed via IPN', { orderId, txnRefNo })
  } else {
    // Payment failed or is pending (e.g., OTC)
    await db.payment.update({
      where: { orderId: orderId },
      data: {
        status: PaymentStatus.FAILED,
        gatewayResponse: params as any,
      },
    }).catch(() => {})

    logger.warn('[JAZZCASH IPN] Payment notification failed/pending', { orderId, responseCode })
  }
}
