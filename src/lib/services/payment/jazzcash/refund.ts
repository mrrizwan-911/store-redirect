import { getJazzCashConfig } from './config'
import {
  generateJazzCashHash,
  generateTxnRefNo,
  formatJazzCashDateTime,
  pkrToPaisas,
} from './hash'
import { logger } from '@/lib/utils/logger'

export interface RefundParams {
  originalTxnRefNo: string   // pp_TxnRefNo from original payment
  orderId: string
  refundAmountPKR: number
  description?: string
}

export interface RefundResponse {
  pp_ResponseCode: string
  pp_ResponseMessage: string
  pp_TxnRefNo: string
  pp_Amount?: string
  pp_SecureHash?: string
  [key: string]: string | undefined
}

/**
 * Initiates a refund for a previously successful JazzCash transaction.
 */
export async function initiateRefund(params: RefundParams): Promise<RefundResponse> {
  const config = getJazzCashConfig()

  const now = new Date()
  const expiry = new Date(now.getTime() + 30 * 60 * 1000) // 30 min expiry
  const txnRefNo = generateTxnRefNo()

  const refundUrl = config.mode === 'production'
    ? 'https://production.jazzcash.com.pk/ApplicationAPI/API/Refund/DoRefundTransaction'
    : 'https://sandbox.jazzcash.com.pk/ApplicationAPI/API/Refund/DoRefundTransaction'

  const requestParams: Record<string, string> = {
    pp_Version: '1.1',
    pp_TxnType: 'REFUND',
    pp_Language: 'EN',
    pp_MerchantID: config.merchantId,
    pp_Password: config.password,
    pp_TxnRefNo: txnRefNo,
    pp_Amount: pkrToPaisas(params.refundAmountPKR),
    pp_TxnCurrency: 'PKR',
    pp_TxnDateTime: formatJazzCashDateTime(now),
    pp_TxnExpiryDateTime: formatJazzCashDateTime(expiry),
    pp_BillReference: params.orderId,
    pp_Description: (params.description ?? `Refund for ${params.orderId}`).slice(0, 60),
    pp_OriginalTxnRefNo: params.originalTxnRefNo,
    pp_ReturnURL: config.returnUrl,
  }

  requestParams.pp_SecureHash = generateJazzCashHash(requestParams, config.integritySalt)

  logger.payment('[JAZZCASH REFUND] Requesting refund', {
    orderId: params.orderId,
    originalTxn: params.originalTxnRefNo,
    amount: params.refundAmountPKR,
  })

  try {
    const response = await fetch(refundUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestParams),
    })

    if (!response.ok) {
      throw new Error(`[JAZZCASH REFUND] HTTP ${response.status}: ${response.statusText}`)
    }

    const result: RefundResponse = await response.json()

    logger.payment('[JAZZCASH REFUND] Response received', {
      orderId: params.orderId,
      responseCode: result.pp_ResponseCode,
      responseMessage: result.pp_ResponseMessage,
    })

    return result
  } catch (error) {
    logger.error('[JAZZCASH REFUND] API Call failed', { error, orderId: params.orderId })
    throw error
  }
}
