import { initiateMATransaction, MATransactionParams, MATransactionResponse } from './ma'
import { initiateOTCTransaction, OTCTransactionParams, OTCTransactionResponse } from './otc'
import { inquireTransaction, InquiryResponse } from './inquiry'
import { buildCardPaymentPayload, CardPaymentParams, CardPaymentPayload } from './card'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { OrderStatus, PaymentStatus } from '@prisma/client'

export type EasypaisaPaymentMode = 'MA' | 'OTC' | 'CARD'

export interface EasypaisaInitiateParams {
  mode: EasypaisaPaymentMode
  orderId: string
  amountPKR: number
  mobileAccountNo?: string  // required for MA and OTC
  emailAddress?: string
}

export interface EasypaisaInitiateResult {
  success: boolean
  mode: EasypaisaPaymentMode
  // MA: transaction completed directly
  transactionId?: string
  // OTC: show this token to customer
  paymentToken?: string
  tokenExpiry?: string
  // CARD: redirect customer to this payload
  cardPayload?: CardPaymentPayload
  responseCode?: string
  responseDesc?: string
  error?: string
}

/**
 * Main entry point for all EasyPaisa payments.
 * Handles Mobile Account, OTC Token, and Card Redirect.
 */
export async function initiateEasypaisaPayment(
  params: EasypaisaInitiateParams
): Promise<EasypaisaInitiateResult> {
  logger.info('[EASYPAISA] Initiating payment', { orderId: params.orderId, mode: params.mode })

  // Ensure payment record exists and is PENDING
  await db.payment.upsert({
    where: { orderId: params.orderId },
    update: { status: PaymentStatus.PENDING },
    create: {
      orderId: params.orderId,
      method: 'EASYPAISA',
      status: PaymentStatus.PENDING,
      amount: params.amountPKR,
    },
  })

  try {
    if (params.mode === 'MA') {
      if (!params.mobileAccountNo) {
        throw new Error('Mobile account number required for MA transaction')
      }

      const result = await initiateMATransaction({
        orderId: params.orderId,
        amountPKR: params.amountPKR,
        mobileAccountNo: params.mobileAccountNo,
        emailAddress: params.emailAddress,
      })

      if (result.responseCode === '0000') {
        // MA is synchronous — update status immediately
        await db.$transaction([
          db.payment.update({
            where: { orderId: params.orderId },
            data: {
              status: PaymentStatus.COMPLETED,
              gatewayRef: result.transactionId,
              gatewayResponse: result as any,
              paidAt: new Date(),
            },
          }),
          db.order.update({
            where: { id: params.orderId },
            data: { status: OrderStatus.CONFIRMED },
          }),
        ])

        return {
          success: true,
          mode: 'MA',
          transactionId: result.transactionId,
          responseCode: result.responseCode,
          responseDesc: result.responseDesc,
        }
      } else {
        await db.payment.update({
          where: { orderId: params.orderId },
          data: {
            status: PaymentStatus.FAILED,
            gatewayResponse: result as any,
          },
        })

        return {
          success: false,
          mode: 'MA',
          responseCode: result.responseCode,
          responseDesc: result.responseDesc,
          error: result.responseDesc,
        }
      }
    }

    if (params.mode === 'OTC') {
      if (!params.mobileAccountNo) {
        throw new Error('Mobile account number required for OTC transaction')
      }

      const result = await initiateOTCTransaction({
        orderId: params.orderId,
        amountPKR: params.amountPKR,
        mobileAccountNo: params.mobileAccountNo,
        emailAddress: params.emailAddress,
        tokenExpiryHours: 48,
      })

      if (result.responseCode === '0000') {
        // OTC is async — store response and return token to show to user
        await db.payment.update({
          where: { orderId: params.orderId },
          data: { gatewayResponse: result as any },
        })

        return {
          success: true,
          mode: 'OTC',
          paymentToken: result.paymentToken,
          tokenExpiry: result.paymentTokenExpiryDateTime,
          responseCode: result.responseCode,
        }
      } else {
        await db.payment.update({
          where: { orderId: params.orderId },
          data: {
            status: PaymentStatus.FAILED,
            gatewayResponse: result as any,
          },
        })

        return {
          success: false,
          mode: 'OTC',
          responseCode: result.responseCode,
          error: result.responseDesc,
        }
      }
    }

    if (params.mode === 'CARD') {
      const cardPayload = buildCardPaymentPayload({
        orderId: params.orderId,
        amountPKR: params.amountPKR,
        emailAddress: params.emailAddress,
        mobileNum: params.mobileAccountNo,
        expiryHours: 1,
      })

      return {
        success: true,
        mode: 'CARD',
        cardPayload,
      }
    }

    throw new Error(`Unsupported EasyPaisa mode: ${params.mode}`)

  } catch (error) {
    logger.error('[EASYPAISA] Fatal initialization error', { error, orderId: params.orderId })

    await db.payment.update({
      where: { orderId: params.orderId },
      data: { status: PaymentStatus.FAILED },
    }).catch(() => {})

    return {
      success: false,
      mode: params.mode,
      error: error instanceof Error ? error.message : 'Unknown error during initialization',
    }
  }
}

export { initiateMATransaction, initiateOTCTransaction, inquireTransaction, buildCardPaymentPayload }
