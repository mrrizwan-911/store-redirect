import { buildHostedCheckoutPayload, HostedCheckoutParams, HostedCheckoutPayload } from './hosted'
import { buildCardPaymentPayload, CardPaymentParams } from './card'
import { initiateMWalletTransaction, WalletTransactionParams } from './wallet'
import { initiateRefund, RefundParams } from './refund'
import { inquireJazzCashTransaction } from './inquiry'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { OrderStatus, PaymentStatus } from '@prisma/client'

export type JazzCashMode = 'HOSTED' | 'WALLET' | 'CARD'

export interface JazzCashInitiateParams {
  mode: JazzCashMode
  orderId: string
  amountPKR: number
  description: string
  customerMobile?: string
  // Only for WALLET mode
  customerCNIC?: string
}

export interface JazzCashInitiateResult {
  success: boolean
  mode: JazzCashMode
  // HOSTED and CARD: return form payload to redirect customer
  hostedPayload?: HostedCheckoutPayload
  // WALLET: transaction completed synchronously
  transactionRef?: string
  retrievalRef?: string
  responseCode?: string
  responseMessage?: string
  error?: string
}

/**
 * Main entry point for initiating a JazzCash payment.
 * Handles Hosted Redirect, Direct Wallet Debit, and Card Redirect.
 */
export async function initiateJazzCashPayment(
  params: JazzCashInitiateParams
): Promise<JazzCashInitiateResult> {
  logger.info('[JAZZCASH] Initiating payment', { orderId: params.orderId, mode: params.mode })

  try {
    if (params.mode === 'HOSTED') {
      const payload = buildHostedCheckoutPayload({
        orderId: params.orderId,
        amountPKR: params.amountPKR,
        description: params.description,
        customerMobile: params.customerMobile,
      })

      // Store txnRef for matching when callback arrives
      await db.payment.update({
        where: { orderId: params.orderId },
        data: { gatewayRef: payload.txnRefNo },
      })

      return { success: true, mode: 'HOSTED', hostedPayload: payload }
    }

    if (params.mode === 'CARD') {
      const payload = buildCardPaymentPayload({
        orderId: params.orderId,
        amountPKR: params.amountPKR,
        description: params.description,
        customerMobile: params.customerMobile,
      })

      await db.payment.update({
        where: { orderId: params.orderId },
        data: { gatewayRef: payload.txnRefNo },
      })

      return { success: true, mode: 'CARD', hostedPayload: payload as any }
    }

    if (params.mode === 'WALLET') {
      if (!params.customerMobile) throw new Error('Customer mobile required for WALLET mode')
      if (!params.customerCNIC) throw new Error('Customer CNIC required for WALLET mode')

      const result = await initiateMWalletTransaction({
        orderId: params.orderId,
        amountPKR: params.amountPKR,
        description: params.description,
        customerMobile: params.customerMobile,
        customerCNIC: params.customerCNIC,
      })

      if (result.pp_ResponseCode === '000') {
        // Wallet mode is synchronous — update status immediately
        await db.$transaction([
          db.payment.update({
            where: { orderId: params.orderId },
            data: {
              status: PaymentStatus.COMPLETED,
              gatewayRef: result.pp_TxnRefNo,
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
          mode: 'WALLET',
          transactionRef: result.pp_TxnRefNo,
          retrievalRef: result.pp_RetreivalReferenceNo,
          responseCode: result.pp_ResponseCode,
          responseMessage: result.pp_ResponseMessage,
        }
      } else {
        // Payment failed
        await db.payment.update({
          where: { orderId: params.orderId },
          data: {
            status: PaymentStatus.FAILED,
            gatewayResponse: result as any,
          },
        })

        return {
          success: false,
          mode: 'WALLET',
          responseCode: result.pp_ResponseCode,
          error: result.pp_ResponseMessage,
        }
      }
    }

    throw new Error(`Unsupported JazzCash mode: ${params.mode}`)

  } catch (error) {
    logger.error('[JAZZCASH] Initialization failed', { error, orderId: params.orderId })

    // Optionally mark payment as failed if it's a fatal error
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

export { initiateRefund, inquireJazzCashTransaction }
