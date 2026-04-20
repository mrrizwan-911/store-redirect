import { createHBLCheckoutSession } from './hostedCheckout'
import { authorizeHBLElementsPayment } from './elements'
import { initiateHBLRefund } from './refund'
import { inquireHBLOrder } from './inquiry'
import { db } from '@/lib/db/client'
import { logger } from '@/lib/utils/logger'
import { OrderStatus, PaymentStatus } from '@prisma/client'

export type HBLIntegrationMode = 'HOSTED' | 'ELEMENTS'

export interface HBLInitiateParams {
  mode: HBLIntegrationMode
  orderId: string
  amountPKR: number
  customerEmail?: string
  customerName?: string
  // Only for ELEMENTS mode — sessionId from HBL Elements form
  elementsSessionId?: string
}

export interface HBLInitiateResult {
  success: boolean
  mode: HBLIntegrationMode
  // HOSTED: redirect customer to this URL
  checkoutUrl?: string
  sessionId?: string
  // ELEMENTS: payment authorized synchronously
  transactionId?: string
  gatewayCode?: string
  error?: string
}

/**
 * Main entry point for all HBL PayConnect payments.
 * Creates a pending payment record and initiates with HBL.
 */
export async function initiateHBLPayment(
  params: HBLInitiateParams
): Promise<HBLInitiateResult> {
  logger.info('[HBL] Initiating payment', { orderId: params.orderId, mode: params.mode })

  // Ensure payment record exists and is PENDING
  await db.payment.upsert({
    where: { orderId: params.orderId },
    update: { status: PaymentStatus.PENDING },
    create: {
      orderId: params.orderId,
      method: 'CARD', // HBL is card-based
      status: PaymentStatus.PENDING,
      amount: params.amountPKR,
    },
  })

  try {
    if (params.mode === 'HOSTED') {
      const session = await createHBLCheckoutSession({
        orderId: params.orderId,
        amountPKR: params.amountPKR,
        customerEmail: params.customerEmail,
        customerName: params.customerName,
      })

      // Store sessionId as gatewayRef for later verification
      await db.payment.update({
        where: { orderId: params.orderId },
        data: { gatewayRef: session.sessionId },
      })

      return {
        success: true,
        mode: 'HOSTED',
        checkoutUrl: session.checkoutUrl,
        sessionId: session.sessionId,
      }
    }

    if (params.mode === 'ELEMENTS') {
      if (!params.elementsSessionId) {
        throw new Error('elementsSessionId required for ELEMENTS mode')
      }

      const result = await authorizeHBLElementsPayment({
        orderId: params.orderId,
        amountPKR: params.amountPKR,
        sessionId: params.elementsSessionId,
      })

      if (result.result === 'SUCCESS') {
        // Elements payment is authorized synchronously
        await db.$transaction([
          db.payment.update({
            where: { orderId: params.orderId },
            data: {
              status: PaymentStatus.COMPLETED,
              gatewayRef: result.transaction?.id,
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
          mode: 'ELEMENTS',
          transactionId: result.transaction?.id,
          gatewayCode: result.gatewayCode,
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
          mode: 'ELEMENTS',
          gatewayCode: result.gatewayCode,
          error: result.error?.message ?? 'Payment declined by bank',
        }
      }
    }

    throw new Error(`Unsupported HBL integration mode: ${params.mode}`)

  } catch (error) {
    logger.error('[HBL] Fatal initiation error', { error, orderId: params.orderId })

    await db.payment.update({
      where: { orderId: params.orderId },
      data: { status: PaymentStatus.FAILED },
    }).catch(() => {})

    return {
      success: false,
      mode: params.mode,
      error: error instanceof Error ? error.message : 'Unknown error during HBL initiation',
    }
  }
}

export { initiateHBLRefund, inquireHBLOrder }
